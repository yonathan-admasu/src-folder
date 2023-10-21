import fs from "fs";
import path from "path";
import logger from "../module_log/log";
import { Browser, Page } from "puppeteer";
import { scraperConfig } from "./utils/config";
import {
  getAttrMultiple,
  getTxt,
  launchBrowser,
  launchPage,
} from "./utils/puppeteerhelper";
import {
  judgesFromPdf,
  solveHCaptcha,
  solveReCaptcha,
  waitFor,
} from "./utils/utilfunctions";
import {
  JudgeData,
  RulingData,
  RulingDataByDepartment,
} from "../module_type/types";
import moment from "moment";

let browser: Browser;
let judgesData: JudgeData[] = [];
const allRulings: RulingDataByDepartment[] = [];
const rulingsData: RulingData[] = [];

const run = async (): Promise<RulingData[]> => {
  try {
    logger(scraperConfig.scraperName, "Started Scraping Site", "success");
    browser = await launchBrowser(true);

    console.log("Retreiving Judges Data ... Started");
    await retrieveJudgesData();
    fs.writeFileSync(
      path.resolve(__dirname, "temp/judges.json"),
      JSON.stringify(judgesData)
    );
    console.log("Retreiving Judges Data ... Finished");

    console.log("Retreiving Rulings From First Five Links ... Started");
    await retrieveRulings();
    fs.writeFileSync(
      path.resolve(__dirname, "temp/allrulings.json"),
      JSON.stringify(allRulings)
    );
    console.log("Retreiving Rulings From First Five Links ... Finished");

    console.log("Cleaning Rulings ... Started");
    await cleanRulings();
    fs.writeFileSync(
      path.resolve(__dirname, "temp/rulings.json"),
      JSON.stringify(rulingsData)
    );
    console.log("Cleaning Rulings Data ... Finished");

    logger(
      scraperConfig.scraperName,
      `Finished Scraping Site, Rulings Found: ${rulingsData.length}`,
      "success"
    );
    await browser.close();

    return rulingsData;
  } catch (error) {
    await logger(
      scraperConfig.scraperName,
      `getRulingsData Error: ${error}`,
      "error"
    );
    console.log(`${scraperConfig.scraperName}: getRulingsData Error: ${error}`);
    throw error;
  }
};

const retrieveJudgesData = async (): Promise<boolean> => {
  const page = await launchPage(browser, false);
  try {
    // Goto Judges Page
    const pdfPath: string = path.join(__dirname, "/temp/judges");

    if (!fs.existsSync(pdfPath)) {
      fs.mkdirSync(pdfPath);
    }

    const client = await page.target().createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: pdfPath,
    });
    await page.goto(scraperConfig.judgesURL, { timeout: 0, waitUntil: "load" });

    // Solve Captcha and Click Link
    await waitFor(5000);
    await solveHCaptcha(page);
    await page.waitForSelector(".clearfix ul > li:nth-child(2) a");
    await page.click(".clearfix ul > li:nth-child(2) a");
    await waitFor(3000);
    await page.close();

    // Check if judges file was created
    const files: string[] = fs.readdirSync(pdfPath);
    if (files.length) {
      const fileName: string = path.join(pdfPath, files[0]);
      judgesData = await judgesFromPdf(fileName);
      console.log(judgesData);

      fs.unlinkSync(fileName);
      return true;
    } else {
      console.log("Judges file was not created");
      throw new Error("Judges file was not created");
    }
  } catch (error) {
    console.log(`retreiveJudgesData Error: ${error}`);
    if (page) await page.close();
    throw error;
  }
};

const retrieveRulings = async (): Promise<boolean> => {
  const page = await launchPage(browser, false);
  try {
    await page.goto(scraperConfig.rulingsURL, {
      timeout: 0,
      waitUntil: "load",
    });
    await waitFor(5000);
    await solveHCaptcha(page);

    const rawRulingsPagesUrls = await getAttrMultiple(
      ".clearfix[class*='main'] > ul > li > a",
      "href",
      page
    );

    const rulingsPagesUrls = [
      rawRulingsPagesUrls[0],
      rawRulingsPagesUrls[1],
      rawRulingsPagesUrls[2],
      rawRulingsPagesUrls[3],
      rawRulingsPagesUrls[5],
      rawRulingsPagesUrls[6],
    ];

    await page.close();

    for (const [i, rulingPageUrl] of rulingsPagesUrls.entries()) {
      console.log(
        `${i + 1}/${
          rulingsPagesUrls.length
        } - Fetching rulings from ${rulingPageUrl}`
      );
      const pageRulings = await retrieveRulingsFromPage(rulingPageUrl);
      if (pageRulings.rulings.length) allRulings.push(pageRulings);
    }

    return true;
  } catch (error) {
    console.log(`retreiveRulings Error: ${error}`);
    if (page) await page.close();
    throw error;
  }
};

const retrieveRulingsFromPage = async (
  pageUrl: string
): Promise<RulingDataByDepartment> => {
  const pageRulings: string[] = [];
  // Open Page
  const page = await launchPage(browser, false);
  try {
    await page.goto(pageUrl, { timeout: 0, waitUntil: "load" });
    await waitFor(15000);
    await solveHCaptcha(page);
    await waitFor(5000);
    await solveReCaptcha(page);

    // Get Department Number from page;
    const h4 = await getTxt("h4", page);
    const matches = h4.match(/(?<=department).*$/gi);
    if (!matches) {
      console.log("Can't find department");
      throw "Can't find department";
    }
    const pageDepartment = matches[0].trim();

    // Get rulings from today's date and further 4 days
    const todayDate = moment().subtract(1, "day");
    for (let i = 0; i < 6; i++) {
      const dateToSearch = todayDate.add(1, "days").format("YYYY-MM-DD");
      console.log(`${i + 1}/6 - Fetching Rulings for Date: ${dateToSearch}`);
      const dateRulings = await retrieveRulingForDate(page, dateToSearch);
      if (dateRulings) pageRulings.push(...dateRulings);
    }

    const results = {
      department: pageDepartment,
      rulings: pageRulings,
    };

    await page.close();
    return results;
  } catch (error) {
    if (page) await page.close();
    console.log(`retreiveRulingsFromPage[${pageUrl}] Error: ${error}`);
    throw error;
  }
};

const retrieveRulingForDate = async (
  page: Page,
  dateToSearch: string
): Promise<string[]> => {
  try {
    await page.waitForSelector("#DatePick");
    await page.evaluate((dateToSearch: string) => {
      const datepicker = document.querySelector(
        "#DatePick"
      ) as HTMLInputElement;
      datepicker.value = dateToSearch;
    }, dateToSearch);
    await page.click("#SearchBtn");
    await waitFor(10000);

    const resultsCount = await getTxt("#resultsCount", page);

    if (resultsCount.toLowerCase().includes("total records found 0")) {
      console.log("No Rulings Found");
      return [];
    }

    const allRulingsContent = await getTxt("#resultsRulings", page);
    const rulingsContent = allRulingsContent.match(
      /case number\:.*?(?=case number|$)/gis
    );
    return rulingsContent ?? [];
  } catch (error) {
    console.log("retreiveRulingForDate Error: ", error);
    throw error;
  }
};

const cleanRulings = async (): Promise<boolean> => {
  try {
    allRulings.forEach((allRuling) => {
      const rulingJudge = judgesData.find(
        (judgeData) => judgeData.department.trim() === allRuling.department
      );
      const rulingDepartment = allRuling.department;
      const rulingCourthouse = rulingJudge ? rulingJudge.courthouse : "";

      allRuling.rulings.forEach((ruling) => {
        const content = ruling.replace(/\t/gi, " ");

        let matches = content.match(/(?<=Court Date\:\s*).*?$/gim);
        if (!matches) {
          console.log("Can't find Court Date");
          throw "Can't find Court Date";
        }
        const rulingDate = matches[0].trim();
        const rulingDateMoment = moment(rulingDate);
        console.log("Date: ", rulingDate, rulingDateMoment);

        matches = content.match(/(?<=Case Number\:\s*).*?$/gim);
        if (!matches) {
          console.log("Can't find Case Number");
          throw "Can't find Case Number";
        }
        const rulingCaseNumber = matches[0].trim();

        matches = content.match(/(?<=Rulings\:\s*).*?$/gis);
        if (!matches) {
          console.log("Can't find Rulings Content");
          throw "Can't find Rulings Content";
        }
        const rulingContent = matches[0].trim();

        const rulingData: RulingData = {
          county: scraperConfig.county,
          department: rulingDepartment,
          courthouse: rulingCourthouse,
          caseNumber: rulingCaseNumber,
          content: rulingContent,
          hearingDate: rulingDateMoment.format("MM/DD/YYYY"),
          day: parseInt(rulingDateMoment.format("DD")),
          month: parseInt(rulingDateMoment.format("MM")),
          year: parseInt(rulingDateMoment.format("YYYY")),
          judge: rulingJudge,
        };

        rulingsData.push(rulingData);
      });
    });

    return true;
  } catch (error) {
    console.log("cleanRulings Error: ", error);
    throw error;
  }
};

export const bot = { run };
