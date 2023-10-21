import moment from "moment";
import { Browser, Page } from "puppeteer";
import { scraperConfig } from "./utils/config";
import { launchBrowser, launchPage } from "./utils/puppeteerhelper";
import CHs from "./utils/courthouses";
import similarity from "./utils/similar";
import logger from "../module_log/log";
import { JudgeData, RulingData } from "../module_type/types";

let browser: Browser;
const rulingsData: RulingData[] = [];
const judgesData: JudgeData[] = [];

const run = async () => {
  try {
    // Log start of scraping
    await logger(scraperConfig.scraperName, "Started Scraping Site", "success");

    // Launch the browser
    browser = await launchBrowser(true);

    // Retrieve Judges Data
    console.log("Retrieving Judges Data... Started");
    await retrieveJudgesData();
    console.log("Retrieving Judges Data... Finished");

    // Retrieve Rulings Data
    console.log("Retrieving Rulings Data... Started");
    await retrieveRulings();
    console.log("Retrieving Rulings Data... Finished");

    // Assign Judges
    console.log("Assigning Judges... Started");
    await assignJudges();
    console.log("Assigning Judges... Finished");

    // Assign Aliases to Rulings
    console.log("Assigning Aliases to Rulings... Started");
    await assignAliasesAndAddresses();
    console.log("Assigning Aliases to Rulings... Finished");

    // Generate Final Rulings Data
    console.log("Generating Final Rulings Data... Started");
    await generateFinalRulingsData();
    console.log("Generating Final Rulings Data... Finished");

    // Log successful completion of scraping
    await logger(
      scraperConfig.scraperName,
      `Finished Scraping Site, Rulings Found: ${rulingsData.length}`,
      "success"
    );

    // Close the browser
    await browser.close();

    return rulingsData; // Return the result
  } catch (error) {
    await browser.close();
    // Log the error
    await logger(
      scraperConfig.scraperName,
      `getRulingsData Error: ${error}`,
      "error"
    );
    console.log(`getRulingsData Error: ${error}`, "error");
    throw error; // Throw the error to be caught by the caller
  }
};

const retrieveJudgesData = async (): Promise<boolean> => {
  try {
    const page: Page = await launchPage(browser, false);
    await page.goto(scraperConfig.judgesURL, { timeout: 0, waitUntil: "load" });
    await page.waitForSelector("table.commontable");
    const trs = await page.$$("table.commontable tbody tr");
    for (const tr of trs) {
      const judge: JudgeData = {
        name: await tr.$eval("td:first-of-type", (elm) => elm.innerText.trim()),
        title: await tr.$eval("td:nth-of-type(2)", (elm) =>
          elm.innerText.trim()
        ),
        courthouse: await tr.$eval("td:nth-of-type(3)", (elm) =>
          elm.innerText.trim()
        ),
        department: await tr.$eval("td:nth-of-type(4)", (elm) =>
          elm.innerText.trim().replace(/^0*/, "").trim()
        ),
        phone: await tr.$eval("td:last-of-type", (elm) => elm.innerText.trim()),
      };
      judgesData.push(judge);
    }
    console.log(`Number of Judges Found: ${judgesData.length}`);
    await page.close();
    return true;
  } catch (error) {
    console.log(`retrieveJudgesData Error: ${error}`);
    await logger(
      scraperConfig.scraperName,
      `retrieveJudgesData Error: ${error}`,
      "error"
    );
    return false;
  }
};

const retrieveRulings = async (): Promise<void> => {
  const page: Page = await launchPage(browser, false);
  try {
    await page.goto(scraperConfig.rulingsURL, {
      timeout: 0,
      waitUntil: "load",
    });
    await page.waitForSelector(
      "#siteMasterHolder_basicBodyHolder_List2DeptDate"
    );
    const optionsNodes = await page.$$(
      "#siteMasterHolder_basicBodyHolder_List2DeptDate option"
    );
    const options = await Promise.all(
      optionsNodes.map(async (optionNode) => {
        const optVal =
          (await page.evaluate(
            (opt) => opt.getAttribute("value"),
            optionNode
          )) ?? "";
        const optText = await page.evaluate((opt) => opt.innerText, optionNode);
        return { optVal, optText };
      })
    );

    for (const { optVal, optText } of options) {
      console.log(
        `${options.findIndex((option) => option.optVal === optVal) + 1}/${
          options.length
        } - Fetching Rulings...`
      );
      if (options.findIndex((option) => option.optVal === optVal) !== 0) {
        await page.goto(scraperConfig.rulingsURL, {
          timeout: 0,
          waitUntil: "load",
        });
        await page.waitForSelector(
          "#siteMasterHolder_basicBodyHolder_List2DeptDate"
        );
      }
      await page.select(
        "#siteMasterHolder_basicBodyHolder_List2DeptDate",
        optVal
      );
      await Promise.all([
        page.waitForNavigation({ timeout: 0, waitUntil: "load" }),
        page.click('input[type="submit"]'),
      ]);
      await page.waitForSelector(".Print", { timeout: 120000 });
      const pageHTMLfull: string = await page.$eval(
        ".Print",
        (el) => el.innerHTML
      );
      const regExp = new RegExp("<p.*?><b> case number:.*?<hr>", "gis");
      const allRulingsContents = pageHTMLfull.match(regExp);
      const rulings = await Promise.all(
        allRulingsContents?.map((rulingContent) =>
          makeRuling(optVal, optText, rulingContent)
        ) ?? []
      );
      rulingsData.push(...rulings);
    }
    console.log(`Number of Rulings Found: ${rulingsData.length}`);
    await page.close();
  } catch (error) {
    console.log(`retrieveRulings Error: ${error}`);
  }
};

const makeRuling = async (
  val: string,
  text: string,
  content: string
): Promise<RulingData> => {
  const short = val.split(",");
  const courthouseMatch = text.match(/(?<=\().*(?= Courthouse)/g);
  const departmentMatch = text.match(/(?<=Dept.).*(?=\))/g);
  const caseNumberMatch = content.match(/(?<=case number: <\/b>.*)[A-Z0-9]+/gi);
  if (!short || !courthouseMatch || !departmentMatch || !caseNumberMatch) {
    throw new Error("Invalid input");
  }
  const ruling: RulingData = {
    county: scraperConfig.county,
    value: val,
    hearingDate: short[2].trim(),
    courthouse: courthouseMatch[0].trim(),
    department: departmentMatch[0].trim(),
    caseNumber: caseNumberMatch[0].trim(),
    content: content.trim(),
  };
  console.log(`Found Case: ${ruling.caseNumber}`);
  return ruling;
};

const assignJudges = async (): Promise<boolean> => {
  try {
    assignJudgesDetails();
    checkJudgesAssignment();
    console.log(`Retrying Judge assignment for the remaining rulings...`);
    assignJudgesDetails();
    checkJudgesAssignment();
    return true;
  } catch (error) {
    await logger(
      scraperConfig.scraperName,
      `assignJudges Error: ${error}`,
      "error"
    );
    throw error;
  }
};

const assignJudgesDetails = () => {
  const judgesMap = new Map<string, JudgeData>();
  judgesData.forEach((judgeData) => {
    const key = `${judgeData.department.toLowerCase()}_${judgeData.courthouse.toLowerCase()}`;
    judgesMap.set(key, judgeData);
  });

  rulingsData.forEach((ruling) => {
    if (!ruling.judge) {
      const key = `${ruling.department.toLowerCase()}_${ruling.courthouse.toLowerCase()}`;
      const judgeData = judgesMap.get(key);
      if (judgeData) {
        ruling.judge = judgeData;
      }
    }
  });
};

const checkJudgesAssignment = () => {
  console.log(`Judges Not Assigned for the following Rulings:`);
  rulingsData.forEach((ruling: RulingData) => {
    if (!ruling.judge) {
      const { caseNumber, courthouse, department } = ruling;
      console.log(
        `Case Number: ${caseNumber}, Courthouse: ${courthouse}, Department: ${department}`
      );
      findDepartmentbyAlias(ruling);
    }
  });
};

const findDepartmentbyAlias = (ruling: RulingData) => {
  const courthouseName = ruling.courthouse.toLowerCase();
  const departmentAlias = ruling.department.toLowerCase();

  const matchedCourthouse = CHs.find(
    (ch) => similarity(courthouseName, ch.name.toLowerCase()) > 0.7
  );

  if (matchedCourthouse) {
    const matchedDepartment = matchedCourthouse.departments.find(
      (dep) => dep.alias.toLowerCase() === departmentAlias
    );
    if (matchedDepartment) {
      ruling.department = matchedDepartment.name;
    }
  }
};

const assignAliasesAndAddresses = async (): Promise<boolean> => {
  try {
    rulingsData.forEach((ruling, index) => {
      const foundCH = CHs.find(
        (ch) =>
          similarity(ruling.courthouse.toLowerCase(), ch.name.toLowerCase()) >
          0.7
      );
      if (foundCH) {
        const foundDept = foundCH.departments.find(
          (dp) => dp.name.toLowerCase() === ruling.department.toLowerCase()
        );
        if (foundDept) {
          ruling.alias = foundDept.alias;
          ruling.address = foundCH.address;
        } else {
          console.log(
            `${index + 1}/${
              rulingsData.length
            } - Couldn't find the department ${ruling.courthouse} Dept ${
              ruling.department
            }`
          );
        }
      } else {
        console.log(
          `${index + 1}/${rulingsData.length} - Couldn't find the courthouse ${
            ruling.courthouse
          } Dept ${ruling.department}`
        );
      }
    });
    return true;
  } catch (error) {
    await logger(
      scraperConfig.scraperName,
      `assignAliases Error: ${error}`,
      "error"
    );
    throw error;
  }
};

const generateFinalRulingsData = async (): Promise<boolean> => {
  try {
    await Promise.all(
      rulingsData.map(async (data: RulingData) => {
        const [month, day, year] = data.hearingDate.match(/\d+/g) as string[];
        const dt = pad(Number(month)) + "/" + pad(Number(day)) + "/" + year;
        data.hearingDate = moment(dt, "MM/DD/YYYY").format();
      })
    );
    return true;
  } catch (error) {
    await logger(
      scraperConfig.scraperName,
      `generateFinalRulingsData Error: ${error}`,
      "error"
    );
    throw error;
  }
};

const pad = (d: number): string => {
  return d < 10 ? "0" + d.toString() : d.toString();
};

export const bot = { run };
