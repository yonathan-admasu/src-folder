import moment from "moment";
import { Page } from "puppeteer";
import _ from "underscore";

type DateType = {
  date: moment.Moment;
  diff: number;
};

const dateRegex1 =
  /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s*\d{1,2}[, ]+\d{4}/gim;
const dateRegex2 = /\d+\/\d+\/\d+/gim;

const fetchData = async (page: Page) => {
  let foundDate = "";
  try {
    const pageContent = await page.$eval("body", (body) =>
      body.innerText
        .trim()
        .split("\n")
        .filter((txt) => txt.trim() !== "" && txt.trim() !== ".")
        .join("\n")
    );
    foundDate = extractDate(pageContent, dateRegex1);
    if (!foundDate) {
      foundDate = extractDate(pageContent, dateRegex2);
    }
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

const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const utils = { fetchData, extractDate, waitFor };
