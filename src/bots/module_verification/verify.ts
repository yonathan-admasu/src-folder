import { Browser, ElementHandle, Page } from "puppeteer";
import moment from "moment";
import fs from "fs";
import path from "path";
import * as _s from "underscore.string";
import logger from "../module_log/log";
import { scraperConfig } from "./utils/config";
import { launchBrowser } from "./utils/puppeteerhelper";
import { launchPage } from "./utils/puppeteerhelper";
import { utils } from "./utils/utilfunctions";
import County, { ICounty } from "../../models/county";
import Ruling, { IRuling } from "../../models/ruling";
import { saveJudge } from "../module_db/db";
import { JudgeData, RulingData } from "../module_type/types";

let browser: Browser;
let rulingsData: RulingData[] = [];
let noOfRulingsVerified = 0;

const verifyRulings = async () => {
  try {
    const jsonPath: string = path.join(__dirname, "/temp");
    if (!fs.existsSync(jsonPath)) {
      fs.mkdirSync(jsonPath);
    }

    await logger(
      "Verification Module SFC",
      "Started Rulings Verification",
      "success"
    );
    browser = await launchBrowser(true);

    await getUnverifiedRulings();

    if (rulingsData.length > 0) {
      console.log("Step1 Verification ... Started");
      await step1Verification();
      fs.writeFileSync(
        path.join(__dirname, "/temp/step1.json"),
        JSON.stringify(rulingsData)
      );
      console.log("Step1 Verification ... Finished");

      console.log("Updating DB after step 1 Verification ... Started");
      await updateDB();
      console.log("Updating DB after step 1 Verification ... Finished");

      console.log("Updating DB after step 2 Verification ... Started");
      await updateRulings();
      console.log("Updating DB after step 2 Verification ... Finished");
    }

    await logger(
      "Verification Module SFC",
      `Finished Rulings Verification, Rulings Verified: ${noOfRulingsVerified}`,
      "success"
    );
    await browser.close();
  } catch (error) {
    if (browser) await browser.close();
    await logger(
      "Verification Module SFC",
      `Rulings Verification: ${error}`,
      "error"
    );
    console.log(`Rulings Verification: ${error}`);
  }
};

const getUnverifiedRulings = async () => {
  try {
    const countyDoc: ICounty | null = await County.findOne({
      name: scraperConfig.county,
    });
    const startDate = moment().subtract(10, "d").startOf("day").format();
    const endDate = moment().subtract(60, "d").startOf("day").format();

    if (!countyDoc) throw new Error("Can't find a county");
    const rulings: IRuling[] = await Ruling.find({
      county: countyDoc._id,
      verified: false,
      hearingDate: { $lte: startDate, $gte: endDate },
    })
      .select("-content")
      .populate({ path: "county" })
      .populate({ path: "judge" })
      .populate({ path: "department", populate: { path: "courthouse" } })
      .lean()
      .exec();
    rulingsData = rulings.map((ruling) => ({
      county: ruling.county.name,
      hearingDate: ruling.hearingDate.toDateString(),
      courthouse: ruling.department.courthouse.name,
      department: ruling.department.name,
      caseNumber: ruling.caseNumber,
      content: ruling.content,
      day: ruling.day,
      month: ruling.month,
      year: ruling.year,
      judge: ruling.judge,
      verified: ruling.verified,
      _id: ruling._id,
    }));

    console.log(
      `No of UnVerified rulings found in DB (10 or more days older): ${rulingsData.length}`
    );
  } catch (error) {
    console.log(`getUnverifiedRulings Error: ${error}`);
  }
};

const step1Verification = async () => {
  try {
    rulingsData = await Promise.all(
      rulingsData.map(async (rulingData, i) => {
        console.log(
          `${i + 1}/${rulingsData.length} - Verifying Ruling ${
            rulingsData[i].caseNumber
          } on Date ${moment(rulingData.hearingDate).format("YYYY-MM-DD")}`
        );
        return await getData(rulingData);
      })
    );
  } catch (error) {
    console.log("step1Verification Error: ", error);
  }
};

const getData = async (rulingDataAsParam: RulingData): Promise<RulingData> => {
  // Launch Page
  let page: Page = await launchPage(browser, false);
  const rulingData: RulingData = JSON.parse(JSON.stringify(rulingDataAsParam));
  try {
    // Solve Captchas
    await page.goto(scraperConfig.verificationUrl, {
      timeout: 0,
      waitUntil: "load",
    });
    await utils.waitFor(5000);
    await utils.solveHCaptcha(page);
    await utils.waitFor(5000);
    await utils.solveReCaptcha(page);

    // Fill in the case number to search
    await page.waitForSelector("input#NumberSearch");
    await page.type("input#NumberSearch", rulingData.caseNumber, { delay: 50 });
    await page.click("button#NumberSearchBtn");
    await utils.waitFor(10000);
    await page.waitForSelector('select[name="example_length"]');
    await page.select('select[name="example_length"]', "-1");
    await utils.waitFor(5000);

    // Get only table rows with date match with ruling date
    const rulingDate = moment(rulingData.hearingDate).format("YYYY-MM-DD");
    const allTrs = await page.$$("table#example > tbody > tr");
    const trsWithDateMatch: ElementHandle<HTMLTableRowElement>[] = [];
    for (const tr of allTrs) {
      const gotTd = await tr.$("td.sorting_1");
      if (!gotTd) {
        console.log("Case Info NOT available yet");
        continue;
      }
      const trDate = await tr.$eval("td.sorting_1", (elm) =>
        elm.innerText.trim()
      );
      if (trDate === rulingDate) trsWithDateMatch.push(tr);
    }

    // Look for judge name in selected rows
    for (const tr of trsWithDateMatch) {
      const proceedingsText = await tr.$eval("td:nth-of-type(2)", (elm) =>
        elm.innerText.trim()
      );
      if (!rulingData.judge) {
        continue;
      }
      let rulingJudgeName;
      if (typeof rulingData.judge === "string")
        rulingJudgeName = utils.convertJudgeName(rulingData.judge);
      if (typeof rulingData.judge === "object")
        rulingJudgeName = utils.convertJudgeName(rulingData.judge.name);

      if (!rulingJudgeName) {
        console.log("Can't find a ruling's Judge Name");
        break;
      }
      if (
        proceedingsText
          .toLocaleLowerCase()
          .includes(rulingJudgeName.toLocaleLowerCase())
      ) {
        console.log("JUDGE MATCHED", rulingJudgeName);
        rulingData.verified = true;
        break;
      }
      const judgeRegex = new RegExp(/(?<=judge pro tem\:).*?(?=clerk)/gi);
      if (judgeRegex.test(proceedingsText)) {
        const matched = proceedingsText.match(judgeRegex);
        if (matched) {
          let judgeFoundInText = matched[0].trim();
          judgeFoundInText = judgeFoundInText
            .replace(/\;$/gi, "")
            .trim()
            .replace(/\,$/gi, "")
            .trim();
          judgeFoundInText = _s.titleize(judgeFoundInText);
          console.log("JUDGE NOT MATCHED...");
          console.log(
            "RULING JUDGE: ",
            typeof rulingData.judge === "object"
              ? rulingData.judge.name
              : rulingData.judge
          );
          console.log("FOUND JUDGE: ", judgeFoundInText);
          (rulingData.judge as JudgeData).name = judgeFoundInText;
          break;
        }
      }
    }

    await page.close();
  } catch (error) {
    if (page) await page.close();
    console.log("getData Error: ", error);
  }
  return rulingData;
};

const updateDB = async () => {
  try {
    await Promise.all(
      rulingsData.map(async (rulingData) => {
        if (rulingData.verified) {
          noOfRulingsVerified++;
          await Ruling.findByIdAndUpdate(rulingData._id, { verified: true });
        }
      })
    );
  } catch (error) {
    console.log(`updateDB Error: ${error}`);
  }
};

const updateRulings = async () => {
  try {
    await Promise.all(
      rulingsData.map(async (rulingData, i) => {
        if (
          !rulingData.verified &&
          (rulingData.judge as JudgeData).name !== ""
        ) {
          console.log(
            `${i + 1}/${rulingsData.length} - ${
              rulingData.caseNumber
            } - Chaning Judge of Ruling to ${rulingData.judge}`
          );

          rulingData.judge = {
            name: (rulingData.judge as JudgeData).name,
            title: "Judge",
            phone: "",
            courthouse: rulingData.courthouse,
            department: rulingData.department,
          };
          const judge = await saveJudge(rulingData);
          await updateRuling(rulingData._id, judge);
          noOfRulingsVerified++;
        }
      })
    );
  } catch (error) {
    console.log(`updateDB Error: ${error}`);
  }
};

const updateRuling = async (rulingId, judge) => {
  try {
    await Ruling.findByIdAndUpdate(rulingId, {
      judge: judge._id,
      verified: true,
    });
  } catch (error) {
    console.log(`updateRuling Error: ${error}`);
  }
};

export default verifyRulings;
