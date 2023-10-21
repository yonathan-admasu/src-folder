import fs from "fs";
import path from "path";
import { Browser, HTTPResponse, Page } from "puppeteer";
import http from "http";
import _s from "underscore.string";
import logger from "../module_log/log";
import { CaseNumberData, JudgeData, RulingData } from "../module_type/types";
import { scraperConfig } from "./utils/config";
import { launchBrowser, launchPage } from "./utils/puppeteerhelper";
import { utils } from "./utils/utilfunctions";
import moment from "moment";
import similarity from "./utils/similar";
import { pdfUtils } from "./utils/pdf";

let browser: Browser;
let judgesData: JudgeData[] = [];
let caseNumbersData: CaseNumberData[] = [];
let rulingsData: RulingData[] = [];

const run = async (): Promise<RulingData[]> => {
  try {
    const pdfPath: string = path.join(__dirname, "/temp");
    if (!fs.existsSync(pdfPath)) {
      fs.mkdirSync(pdfPath);
    }

    await logger(scraperConfig.scraperName, "Started Scraping Site", "success");
    browser = await launchBrowser(true);

    console.log("Retreiving Judges Data ... Started");
    await retrieveJudgesData();
    console.log("Retreiving Judges Data ... Finished");
    const judgesFilePath = path.resolve(__dirname, "temp/judges.json");
    fs.writeFileSync(judgesFilePath, JSON.stringify(judgesData));

    console.log(`Fetching Case Numbers ... Started`);
    await fetchCaseNumbers();
    console.log(`Fetching Case Numbers ... Finished`);
    const cnsFilePath = path.resolve(__dirname, "temp/casenumbers.json");
    fs.writeFileSync(cnsFilePath, JSON.stringify(caseNumbersData));

    console.log("Retreiving Rulings Data ... Started");
    await retrieveRulings();
    console.log("Retreiving Rulings Data ... Finished");
    const rulingsFilePath = path.resolve(__dirname, "temp/rulings.json");
    fs.writeFileSync(rulingsFilePath, JSON.stringify(rulingsData));

    console.log("Assigning Judges ... Started");
    await assignJudges();
    console.log("Assigning Judges ... Finished");
    const assignJudgesFilePath = path.resolve(
      __dirname,
      "temp/assignJudges.json"
    );
    fs.writeFileSync(assignJudgesFilePath, JSON.stringify(rulingsData));

    await logger(
      scraperConfig.scraperName,
      `Finished Scraping Site, Rulings Found: ${rulingsData.length}`,
      "success"
    );
    await browser.close();

    return rulingsData;
  } catch (error) {
    await browser.close();
    await logger(
      scraperConfig.scraperName,
      `getRulingsData Error: ${error}`,
      "error"
    );
    console.log(`getRulingsData Error: ${error}`, "error");
    throw error;
  }
};

const retrieveJudgesData = async (): Promise<boolean> => {
  const page: Page = await launchPage(browser, false);
  try {
    const judgesUrl = scraperConfig.judgesURL;
    for (const judgeUrl of judgesUrl) {
      const res: HTTPResponse | null = await page.goto(judgeUrl, {
        timeout: 0,
        waitUntil: "load",
      });

      if (!res) {
        console.log(`${judgeUrl} doesn't work`);
        continue;
      }

      if (res.status() !== 200) {
        console.log(`Response Status Not OK: ${judgeUrl}`);
        continue;
      }

      await page.waitForSelector("table.assignTable");
      const trs = await page.$$("table.assignTable tbody tr");
      for (const tr of trs) {
        let name =
          (await tr.$eval("td.tdJudgeName", (el) => el.textContent?.trim())) ||
          "";
        name = _s.titleize(name);
        const dept = await tr.$eval("td.tdJudgeDept", (elm) =>
          elm.innerText.trim().trim()
        );
        const ch = await tr.$eval("td.tdJudgeLocAndCaseType", (elm) =>
          elm.innerText.trim().trim()
        );
        const phone = "";
        const judge = {
          title: name.toLocaleLowerCase().includes("commissioner")
            ? "Commissioner"
            : "Judge",
          name: name
            .replace(/\-\s*judge/gi, "")
            .replace(/\-\s*commissioner/gi, "")
            .trim(),
          courthouse: ch.replace(/\n.*$/gi, "").trim(),
          department: dept.replace(/dept\./gi, "").trim(),
          phone,
        };

        judgesData.push(judge);
      }
    }

    console.log(`Number of Judges Found: ${judgesData.length}`);
    await page.close();
    return true;
  } catch (error) {
    console.log(`retreiveJudgesData Error: ${error}`);
    await logger(
      scraperConfig.scraperName,
      `retreiveJudgesData Error: ${error}`,
      "error"
    );
    if (page) await page.close();
    throw error;
  }
};

const fetchCaseNumbers = async () => {
  const page = await launchPage(browser, false);
  try {
    for (const [i, caseNumbersUrl] of scraperConfig.caseNumbersUrls.entries()) {
      console.log(
        `${i + 1}/${
          scraperConfig.caseNumbersUrls.length
        } - Fetching Case Numbers`
      );
      await page.goto(caseNumbersUrl, {
        timeout: 0,
        waitUntil: "networkidle2",
      });

      await page.waitForSelector("table");
      const allTds = await page.$$eval("td", (tds) =>
        tds.map((td) => td.innerText.trim())
      );
      const date = await utils.fetchData(page);
      console.log(date);
      const cns = allTds.filter(
        (td) =>
          /\d/gi.test(td) &&
          !/am$/gi.test(td) &&
          !/pm$/gi.test(td) &&
          !/\s/gi.test(td) &&
          !/dept/gi.test(td) &&
          td.length > 4
      );

      const correctCns = cns.filter((cn) =>
        /(?<=\-)\d{4}\-\d+(?=\-)/gi.test(cn)
      );
      const cnsToSave = correctCns.map((cn) => ({
        date,
        caseNumber: cn.trim().toUpperCase(),
      }));
      caseNumbersData.push(...cnsToSave);
    }

    console.log(`Found Case Numbers: ${caseNumbersData.length}`);

    // Remove the duplicates
    const caseNumbers = caseNumbersData.map(
      (caseNumberData) => caseNumberData.caseNumber
    );
    caseNumbersData = caseNumbersData.filter(
      (caseNumberData, index) =>
        caseNumbers.indexOf(caseNumberData.caseNumber) === index
    );
    console.log(
      `Found Case Numbers (after removing duplicates): ${caseNumbersData.length}`
    );
    await page.close();
  } catch (error) {
    if (page) await page.close();
    console.log(`fetchCaseNumbers Error: ${error}`);
    throw error;
  }
};

const retrieveRulings = async () => {
  try {
    for (let i = 0; i < caseNumbersData.length; i++) {
      await fetchSingleRuling(i);
    }
  } catch (error) {
    console.log(`retreiveRulings Error: ${error}`);
    await logger(
      scraperConfig.scraperName,
      `retreiveRulings Error: ${error}`,
      "error"
    );
    throw error;
  }
};

const fetchSingleRuling = async (index) => {
  const page = await launchPage(browser, false);
  try {
    let ruling;
    console.log(
      `${index + 1}/${
        caseNumbersData.length
      } - Fetching Rulings for Case Number: ${
        caseNumbersData[index].caseNumber
      }`
    );

    // Save pdf when it is loaded by the page
    const pdfPath = path.join(
      __dirname,
      `/temp/${caseNumbersData[index].caseNumber}.pdf`
    );
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      if (req.url().toLowerCase().includes("viewrulings")) {
        const file = fs.createWriteStream(pdfPath);
        http.get(req.url(), (response) => response.pipe(file));
      }
      req.continue();
    });

    // Goto rulings page
    await page.goto(scraperConfig.rulingsURL, {
      timeout: 0,
      waitUntil: "load",
    });
    await page.waitForSelector('input[type="text"]');

    // Format the case number and enter in the input
    let matches = caseNumbersData[index].caseNumber.match(
      /(?<=\-)\d{4}\-\d+(?=\-)/gi
    );
    if (!matches) {
      throw new Error("Can't find caseNumber");
    }
    const caseNumberForInput = matches[0].trim();
    await page.type('input[type="text"]', caseNumberForInput, { delay: 10 });

    // Click submit and wait for load
    await page.click('input[value="View Ruling"]');
    await utils.waitFor(1500);
    await page.waitForSelector("body");

    // Get entire page content
    const pageContent = (await page.content()).toLowerCase();
    if (
      !pageContent.includes(
        "No Tentative Ruling is found that matches Case Number".toLowerCase()
      )
    ) {
      console.log("Found Ruling...");

      // Check for Date Select, and Fill it accordingly
      const hasDateSelect = await page.$('select[name*="HearingDates"]');

      if (hasDateSelect) {
        const dateOptionsNodes = await page.$$(
          'select[name*="HearingDates"] > option'
        );
        let dateOptionValue = "";
        console.log("Ruling Date - Date Option");

        for (const dateOptionsNode of dateOptionsNodes) {
          const dateOption = await page.evaluate(
            (elm) => elm.innerText.trim(),
            dateOptionsNode
          );
          console.log(caseNumbersData[index].date, " - ", dateOption);
          if (dateOption === caseNumbersData[index].date) {
            dateOptionValue =
              (await page.evaluate(
                (elm) => elm.getAttribute("value"),
                dateOptionsNode
              )) || "";
            break;
          }
          if (!dateOptionValue) {
            console.log("Date Match NOT FOUND...");
          } else {
            await page.select('select[name*="HearingDates"]', dateOptionValue);
            await Promise.all([
              page.waitForNavigation({ timeout: 0, waitUntil: "load" }),
              await page.click('input[value="OK"]'),
            ]);
          }
        }
      }

      // Wait for the pdf to download
      await utils.waitFor(10000);

      // Check if pdf file was created
      if (!fs.existsSync(pdfPath)) {
        await page.close();
        console.log("Pdf File Not Found...");
        return false;
      }

      // Extract Date from PDF
      const pdfText = await pdfUtils.convertPdfToText(pdfPath);
      const pdfHtml = await pdfUtils.convertTextToHtml(pdfText);
      fs.unlinkSync(pdfPath);
      ruling = await makeRuling(index, pdfText, pdfHtml);

      if (ruling.caseNumber.length > 4) {
        rulingsData.push(ruling);
      }
    }

    await page.close();
    return true;
  } catch (error) {
    if (page) await page.close();
    console.log(
      `fetchSingleRuling[${caseNumbersData[index].caseNumber}] Error: ${error}`
    );
    throw error;
  }
};

const makeRuling = async (
  index: number,
  pdfText: string,
  pdfHtml: string
): Promise<RulingData> => {
  const dt = moment(caseNumbersData[index].date, "MM/DD/YYYY");
  let matches = pdfText.match(/(?<=judicial officer\:).*/gi);
  const ruling: RulingData = {
    county: scraperConfig.county,
    courthouse: "",
    department: "",
    caseNumber: caseNumbersData[index].caseNumber,
    content: pdfHtml.replace(/"/gi, `'`),
    hearingDate: caseNumbersData[index].date,
    day: parseInt(dt.format("DD")),
    month: parseInt(dt.format("MM")),
    year: parseInt(dt.format("YYYY")),
    judge: matches ? matches[0].trim() : undefined,
  };

  return ruling;
};

const assignJudges = () => {
  for (const [i, rulingData] of rulingsData.entries()) {
    console.log(`${i + 1}/${rulingsData.length} - Assigning Judge...`);
    for (const judgeData of judgesData) {
      let judgeName = judgeData.name;
      if (judgeName.split(",").length > 1) {
        judgeName =
          judgeName.split(",")[1].trim() + " " + judgeName.split(",")[0].trim();
      }

      const cond1 = similarity(judgeName, rulingData.judge as string) > 0.7;
      if (cond1) {
        rulingData.judge = {
          name: judgeData.name,
          title: judgeData.title,
          phone: judgeData.phone,
        } as JudgeData;
        rulingData.courthouse = judgeData.courthouse || "";
        rulingData.department = judgeData.department || "";
        break;
      }
    }
  }
};

export const bot = { run };
