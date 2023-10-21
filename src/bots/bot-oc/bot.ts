import fs from "fs";
import path from "path";
import { Browser } from "puppeteer";
import _s from "underscore.string";
import logger from "../module_log/log";
import { JudgeData, RulingData, RulingLinkType } from "../module_type/types";
import { scraperConfig } from "./utils/config";
import { getTxt, launchBrowser, launchPage } from "./utils/puppeteerhelper";
import { utils } from "./utils/utilfunctions";
import moment from "moment";

let browser: Browser;
let judgesData: JudgeData[] = [];
let rulingsLinks: RulingLinkType[] = [];
let rulingsData: RulingData[] = [];

const run = async (): Promise<RulingData[]> => {
  try {
    const jsonPath: string = path.join(__dirname, "/temp");
    if (!fs.existsSync(jsonPath)) {
      fs.mkdirSync(jsonPath);
    }

    await logger(scraperConfig.scraperName, "Started Scraping Site", "success");
    browser = await launchBrowser(true);

    console.log("Retreiving Judges Data ... Started");
    await retrieveJudgesData();
    console.log("Retreiving Judges Data ... Finished");
    const judgesFilePath = path.resolve(__dirname, "temp/judges.json");
    fs.writeFileSync(judgesFilePath, JSON.stringify(judgesData));

    console.log("Retreiving Rulings Links ... Started");
    await retrieveRulingsLinks("civil");
    await retrieveRulingsLinks("family");
    console.log("Retreiving Rulings Links ... Finished");
    const rulingsLinksFilePath = path.resolve(
      __dirname,
      "temp/rulingslinks.json"
    );
    fs.writeFileSync(rulingsLinksFilePath, JSON.stringify(rulingsLinks));

    console.log("Retreiving Rulings Data ... Started");
    await retrieveRulings();
    console.log("Retreiving Rulings Data ... Finished");
    const rulingsFilePath = path.resolve(__dirname, "temp/rulingsData.json");
    fs.writeFileSync(rulingsFilePath, JSON.stringify(rulingsData));

    console.log("Assigning Judges ... Started");
    await assignJudges();
    await assignJudgesAgain();
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

const retrieveJudgesData = async () => {
  let page = await launchPage(browser, false);
  try {
    await page.goto(scraperConfig.judgesURL, { timeout: 0, waitUntil: "load" });
    await page.waitForSelector("table.judicial-officers");

    const trs = await page.$$("table.judicial-officers tbody tr");
    for (const tr of trs) {
      const name = _s.titleize(
        await tr.$eval("td:first-of-type", (elm) =>
          elm.innerText.trim().toLowerCase()
        )
      );
      const dept = await tr.$eval("td:nth-of-type(4)", (elm) =>
        elm.innerText.trim().replace(/nbsp;/, "").trim()
      );
      const deptch = utils.getDeptandCourthouse(dept);
      const phone = await tr.$eval("td:last-of-type", (elm) =>
        elm.innerText.trim()
      );
      const judge = {
        title: name.toLowerCase().includes("comm.") ? "Commissioner" : "Judge",
        name: name.replace(/\(comm.\)/gi, "").trim(),
        courthouse: deptch.courthouse,
        department: deptch.department,
        phone,
      } as JudgeData;

      judgesData.push(judge);
    }
    console.log(`Judges Found: ${judgesData.length}`);
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
  }
};

const retrieveRulingsLinks = async (type) => {
  let page = await launchPage(browser, false);
  try {
    const url =
      type == "civil"
        ? scraperConfig.rulingsURLCivil
        : scraperConfig.rulingsURLFamily;
    await page.goto(url, { timeout: 0, waitUntil: "load" });
    await page.waitForSelector(".subContent > ul.anchors > li > a");
    const judgesNodes = await page.$$(".subContent > ul.anchors > li > a");

    for (const judgeNode of judgesNodes) {
      const judgeNodeText = await page.evaluate(
        (elm) => elm.innerText.trim(),
        judgeNode
      );
      const judgeNodeUrl = await page.evaluate(
        (elm) => elm.getAttribute("href"),
        judgeNode
      );
      if (!judgeNodeUrl) continue;

      let matches = judgeNodeText.match(/(?<=-).*$/gi);
      if (!matches) continue;
      const deptCHRaw = matches[0].trim().replace(/dept/gi, "").trim();
      const deptCH = utils.getDeptandCourthouse(deptCHRaw);

      const matchedUrls = judgeNodeUrl.match(/(?<=open\(').*?(?=',)/gi);
      if (!matchedUrls) continue;
      const matchedTexts = judgeNodeText.match(/^.*?(?=-)/gi);
      if (!matchedTexts) continue;

      const rulingLink = {
        type,
        url: scraperConfig.siteLink + matchedUrls[0].trim(),
        judge: _s.titleize(matchedTexts[0].trim()),
        ...deptCH,
      };

      rulingsLinks.push(rulingLink);
    }
  } catch (error) {
    console.log(`retreiveRulings Error: ${error}`);
    await logger(
      scraperConfig.scraperName,
      `retreiveRulings Error: ${error}`,
      "error"
    );
    if (page) await page.close();
    throw error;
  }
};

const retrieveRulings = async () => {
  let page = await launchPage(browser, false);
  try {
    for (const [index, rulingLink] of rulingsLinks.entries()) {
      console.log(
        `${index + 1}/${rulingsLinks.length} - Fetching Rulings from ${
          rulingLink.url
        }`
      );
      await page.goto(rulingLink.url, { timeout: 0, waitUntil: "load" });
      await page.waitForSelector("body");

      const gotTable = await page.$("table > tbody > tr");

      if (!gotTable) {
        console.log("INVALID - No Table Found");
        continue;
      }

      const tableContent = await getTxt("table > tbody", page);
      if (
        tableContent.toLowerCase().includes("this is a test") ||
        tableContent.toLowerCase() == ""
      ) {
        console.log("INVALID - Test Page");
        continue;
      }

      const numberOfRows = await page.$$("table > tbody > tr");
      if (numberOfRows.length <= 2) {
        console.log("INVALID - Table is Empty");
        continue;
      }

      const foundDate = await utils.fetchDate(page);
      if (!foundDate) {
        console.log("INVALID - Ruling Date not Found");
        continue;
      }

      await page.goto(rulingLink.url, {
        timeout: 0,
        waitUntil: "networkidle2",
      });
      await page.waitForSelector("table");
      const rulingsTrs = await page.$$("table tr");

      for (const rulingTr of rulingsTrs) {
        const rulingTds = await rulingTr.$$("td");
        if (rulingTds.length < 3) continue;
        const caseSerial = await page.evaluate(
          (elm) => elm.innerText.trim(),
          rulingTds[0]
        );
        const caseNameText = await page.evaluate(
          (elm) =>
            elm.innerText
              .trim()
              .split("\n")
              .filter((a) => a.trim() !== "")
              .join("\n"),
          rulingTds[1]
        );
        const caseRulingText = await page.evaluate(
          (elm) => elm.innerText.trim(),
          rulingTds[2]
        );

        if (
          caseSerial.length > 0 &&
          caseNameText.length > 0 &&
          caseRulingText.length > 200
        ) {
          const caseNumber = utils.fetchCaseNumber(caseNameText);
          const rulingContent = await page.evaluate(
            (elm) => elm.innerHTML,
            rulingTds[2]
          );

          const foundDateMoment = moment(foundDate);
          const ruling: RulingData = {
            county: scraperConfig.county,
            caseNumber,
            content: rulingContent,
            hearingDate: foundDateMoment.format("MM/DD/YYYY"),
            day: parseInt(foundDateMoment.format("DD")),
            month: parseInt(foundDateMoment.format("MM")),
            year: parseInt(foundDateMoment.format("YYYY")),
            judge: rulingLink.judge,
            department: rulingLink.department,
            courthouse: rulingLink.courthouse,
          };

          if (ruling.caseNumber.length > 4 && ruling.caseNumber.length < 80) {
            rulingsData.push(ruling);
          }
        }
      }
    }
  } catch (error) {
    console.log(`retreiveRulings Error: ${error}`);
    await logger(
      scraperConfig.scraperName,
      `retreiveRulings Error: ${error}`,
      "error"
    );
    if (page) await page.close();
    throw error;
  }
};

const assignJudges = () => {
  for (const [i, rulingData] of rulingsData.entries()) {
    console.log(`${i + 1}/${rulingsData.length} - Assigning Judge...`);
    for (const judgeData of judgesData) {
      if (!judgeData) continue;
      const cond1 =
        judgeData.department.toLowerCase() ==
        rulingData.department.toLowerCase();
      const cond2 = judgeData.courthouse
        .toLowerCase()
        .includes(rulingData.courthouse.toLowerCase());
      const cond3 = rulingData.courthouse
        .toLowerCase()
        .includes(judgeData.courthouse.toLowerCase());

      if (cond1 && (cond2 || cond3)) {
        const judge = {
          name: judgeData.name,
          title: judgeData.title,
          phone: judgeData.phone,
        } as JudgeData;
        rulingData.judge = judge;
        break;
      }
    }
  }
};

const assignJudgesAgain = () => {
  for (const [i, rulingData] of rulingsData.entries()) {
    if (!(rulingData.judge as JudgeData).name) {
      console.log(`${i + 1}/${rulingsData.length} - Assigning Judge Again...`);
      for (const judgeData of judgesData) {
        const cond1 =
          judgeData.department.toLowerCase() ==
          rulingData.department.toLowerCase();
        if (cond1) {
          const judge = {
            name: judgeData.name,
            title: judgeData.title,
            phone: judgeData.phone,
          } as JudgeData;
          rulingData.judge = judge;
          break;
        }
      }
    }
  }
};

export const bot = { run };
