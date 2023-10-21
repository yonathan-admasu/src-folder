import { Page } from "puppeteer";
import { courthouses } from "./courthouses";
import moment from "moment";
import _ from "underscore";

type DateType = {
  date: moment.Moment;
  diff: number;
};

const dateRegex1 =
  /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{1,2}[, ]+\d{4}/gim;
const dateRegex2 = /\d+\/\d+\/\d+/gim;

const getDeptandCourthouse = (dept) => {
  const returnVal = {
    courthouse: "",
    department: "",
  };

  if (dept.includes("/")) {
    dept = dept.split("/")[0];
  }

  for (const key in courthouses) {
    const courthouseRegex = new RegExp(`^${key}\\d+`, "gi");
    if (courthouseRegex.test(dept)) {
      const deptRegex = new RegExp(`(?<=${key}).*$`, "gi");
      returnVal.courthouse = courthouses[key];
      let matches = dept.match(deptRegex);
      returnVal.department = matches ? matches[0].trim() : "";
      break;
    }
  }

  if (returnVal.courthouse === "" && returnVal.department === "") {
    for (const key in courthouses) {
      const courthouseRegEx = new RegExp(`^${key}.*$`, "gi");
      if (courthouseRegEx.test(dept)) {
        const deptRegex = new RegExp(`(?<=${key}).*$`, "gi");
        returnVal.courthouse = courthouses[key];
        returnVal.department = dept.match(deptRegex)[0].trim();
      }
    }
  }

  return returnVal;
};

const fetchDate = async (page: Page) => {
  try {
    const pageContent = await page.evaluate(() => {
      const table = document.querySelector("table");
      if (table) table.remove();

      return (
        document
          .querySelector("body")
          ?.innerText.trim()
          .split("\n")
          .filter((pc) => pc.trim() !== "" && pc.trim() !== ".")
          .join("\n") || ""
      );
    });

    let foundDate = extractDate(pageContent, dateRegex1);
    if (!foundDate) foundDate = extractDate(pageContent, dateRegex2);

    return foundDate;
  } catch (error) {
    console.log(`fetchDate Error: ${error}`);
    throw error;
  }
};

const extractDate = (pageContent: string, regex: RegExp) => {
  let retVal = "";
  if (regex.test(pageContent)) {
    const matchedDates = pageContent.match(regex);
    let allDates: DateType[] = [];
    if (!matchedDates) throw new Error("Can't find specified styled date");

    matchedDates.forEach((matchedDate) => {
      const date = moment(matchedDate, [
        "MMMM DD, YYYY",
        "MMMM D, YYYY",
        "MMMM D,YYYY",
        "MMMM DD,YYYY",
        "MM/DD/YYYY",
        "M/D/YYYY",
        "MM/D/YYYY",
        "M/DD/YYYY",
      ]);
      const diff = moment().diff(date, "days");
      allDates.push({ date, diff });
    });

    allDates = _.sortBy(allDates, "diff");
    if (allDates[0].diff < 10) {
      retVal = allDates[0].date.format("MM/DD/YYYY");
    }
  }
  return retVal;
};

const fetchCaseNumber = (caseNumberText: string): string => {
  let returnVal = "";

  const caseNumbers = caseNumberText.split("\n").filter((cn) => cn !== "");
  for (const caseNumber of caseNumbers) {
    if (/\d{4,}/gi.test(caseNumber)) {
      returnVal = caseNumber.replace(/\s+/gi, "").trim();
      break;
    }
  }

  if (!returnVal) {
    returnVal = caseNumberText.replace(/\n/gi, " ");
  }

  return returnVal;
};

export const utils = { getDeptandCourthouse, fetchDate, fetchCaseNumber };
