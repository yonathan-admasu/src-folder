import { Page } from "puppeteer";
import axios from "axios";
import {
  PDFExtract,
  PDFExtractOptions,
  PDFExtractPage,
  PDFExtractText,
} from "pdf.js-extract";
import * as _s from "underscore.string";
import { getAttr } from "./puppeteerhelper";
import { scraperConfig } from "./config";
import { CaptchaResponse, JudgeData } from "../../module_type/types";

const solveHCaptcha = async (page: Page): Promise<boolean> => {
  try {
    let captchaSolved = false;
    console.log("Solving hCaptcha");

    await page.waitForSelector("body");
    await waitFor(3000);
    let hCaptchaFrame = await page.$("iframe[data-hcaptcha-response]");

    // Check if HCaptcha is there
    if (!hCaptchaFrame) {
      // HCaptcha Not Found
      console.log("hCaptcha Not Found...");
      return true;
    }

    console.log("hCaptcha Found...");
    while (true) {
      // HCaptcha Found
      // Generate Request URL for 2captcha
      let siteKey = await getAttr(
        "iframe[data-hcaptcha-response]",
        "src",
        page
      );
      if (!siteKey) {
        console.log("Didn't find site key");
        return false;
      }

      const matches = siteKey.match(/(?<=sitekey\=).*$/gi);
      if (!matches) {
        console.log("Didn't find site key");
        return false;
      }

      siteKey = matches[0].trim();
      const pageUrl = await page.url();
      const requestUrl = `https://2captcha.com/in.php?key=${scraperConfig.twoCaptchaKey}&method=hcaptcha&json=1&sitekey=${siteKey}&pageurl=${pageUrl}`;

      // Send Captcha Solving Request to 2captcha
      let captchaResponse: CaptchaResponse;
      while (true) {
        captchaResponse = (await axios.get(requestUrl)).data as CaptchaResponse;
        if (captchaResponse.status === 1) break;
      }

      // Check Status of Captcha Solving Request
      const requestId = captchaResponse.request;
      const resultUrl = `https://2captcha.com/res.php?key=${scraperConfig.twoCaptchaKey}&action=get&id=${requestId}&json=1`;
      let captchaSolutionResponse: CaptchaResponse;
      while (true) {
        captchaSolutionResponse = (await axios.get(resultUrl))
          .data as CaptchaResponse;
        if (captchaSolutionResponse.status === 1) break;
      }

      // Submit Captcha Results
      const token = captchaSolutionResponse.request;
      await page.evaluate(() => {
        const selector = document.querySelector(
          "[name=h-captcha-response]"
        ) as HTMLElement;
        if (selector) selector.innerText = token;
        const submittor = document.querySelector(".challenge-form");
        if (submittor) (<HTMLFormElement>submittor).submit();
      });

      // Check if hCaptcha was passed
      await page.waitForSelector("body");
      await waitFor(5000);
      hCaptchaFrame = await page.$("iframe[data-hcaptcha-response]");

      if (!hCaptchaFrame) {
        console.log("Captcha Solved...");
        captchaSolved = true;
        const reportGoodUrl = `https://2captcha.com/res.php?key=${scraperConfig.twoCaptchaKey}&action=reportgood&id=${requestId}`;
        await axios.get(reportGoodUrl);
        return true;
      }
      console.log("Captcha Not Solved... Retrying");
      const reportBadUrl = `https://2captcha.com/res.php?key=${scraperConfig.twoCaptchaKey}&action=reportbad&id=${requestId}`;
      await axios.get(reportBadUrl);

      if (captchaSolved) break;
    }
    return true;
  } catch (error) {
    console.log(`solveHCaptcha Error: ${error}`);
    throw error;
  }
};

const solveReCaptcha = async (page: Page): Promise<boolean> => {
  try {
    let captchaSolved = false;
    console.log("Solving reCaptcha");

    await page.waitForSelector("body");
    await waitFor(3000);
    await page.waitForSelector(".g-recaptcha");
    const siteKey = await getAttr(".g-recaptcha", "data-sitekey", page);

    if (!siteKey) {
      // reCaptcha Not Found
      console.log("reCaptcha Not Found...");
      return true;
    }

    while (true) {
      // reCaptcha Found
      // Generate Request URL for 2captcha
      console.log("reCaptcha Found...");
      const pageUrl = await page.url();
      const requestUrl = `http://2captcha.com/in.php?key=${scraperConfig.twoCaptchaKey}&method=userrecaptcha&googlekey=${siteKey}&pageurl=${pageUrl}&json=1`;

      // Send Captcha Solving Request to 2captcha
      let captchaResponse: CaptchaResponse;
      while (true) {
        captchaResponse = (await axios.get(requestUrl)).data;
        if (captchaResponse.status === 1) break;
      }

      // Check Status of Captcha Solving Request
      const requestId = captchaResponse.request;
      const resultUrl = `https://2captcha.com/res.php?key=${scraperConfig.twoCaptchaKey}&action=get&id=${requestId}&json=1`;
      let captchaSolutionResponse: CaptchaResponse;
      while (true) {
        waitFor(150000);
        captchaSolutionResponse = (await axios.get(resultUrl)).data;
        if (captchaSolutionResponse.status === 1) break;
      }

      // Submit Captcha Results
      const token = captchaSolutionResponse.request;
      await page.evaluate((token: string) => {
        const selector = document.querySelector(
          "#g-recaptcha-response"
        ) as HTMLElement;
        if (selector) {
          selector.style.display = "block";
          selector.innerHTML = token;
        }

        const submittor = document.querySelector("#WebForm");
        if (submittor) (<HTMLFormElement>submittor).submit();
      }, token);

      // Check if Captcha was passed
      await page.waitForSelector("body");
      await waitFor(5000);
      const reCaptchaBox = await page.$(".g-recaptcha");
      if (!reCaptchaBox) {
        console.log("Captcha Solved...");
        captchaSolved = true;
        const reportGoodUrl = `https://2captcha.com/res.php?key=${scraperConfig.twoCaptchaKey}&action=reportgood&id=${requestId}`;
        await axios.get(reportGoodUrl);
        return true;
      }
      console.log("Captcha Not Solved... Retrying");
      const reportBadUrl = `https://2captcha.com/res.php?key=${scraperConfig.twoCaptchaKey}&action=reportbad&id=${requestId}`;
      await axios.get(reportBadUrl);

      if (captchaSolved) break;
    }
    return true;
  } catch (error) {
    console.log(`solveReCaptcha Error: ${error}`);
    throw error;
  }
};

const judgesFromPdf = async (pdfPath: string): Promise<JudgeData[]> => {
  try {
    const pdfExtract = new PDFExtract();
    const option: PDFExtractOptions = {};
    const data = await pdfExtract.extract(pdfPath, option);
    const txt = extractData(data.pages);

    // Get Single Judges Rows
    let textRows: string[] = txt.split("\n");
    textRows = textRows.slice(4).map((tr) => tr.trim());
    textRows = textRows.filter(
      (tr) =>
        tr !== "" &&
        tr !== "\f" &&
        !tr.toLowerCase().startsWith("dept") &&
        !tr.toLocaleLowerCase().endsWith("-")
    );

    const singleRows: string[] = [];
    textRows.forEach((tr) => {
      if (tr.length < 52) singleRows.push(tr.trim());
      else {
        const matches = tr.match(/^.*?\d{3}\-\d+\s/gi);
        if (matches) {
          const judgeOne = matches[0].trim();
          const judgeTwo = tr.replace(judgeOne, "").trim();
          singleRows.push(judgeOne, judgeTwo);
        }
      }
    });

    for (let i = 0; i < singleRows.length; i++) {
      if (singleRows[i].startsWith("/")) {
        singleRows[i - 1] += " " + singleRows[i].slice(0, 11).trim();
        singleRows[i] = singleRows[i].slice(11);
      }
    }

    // Extract Judges Information
    const judges: JudgeData[] = [];

    singleRows.forEach((singleRow) => {
      let matches = singleRow.match(/(?<=\s)\d{3}\-\d+ \/ \d{3}\-\d+$/gi);
      if (!matches) {
        matches = singleRow.match(/(?<=\s)\d{3}\-\d+$/gi);
      }
      const phone = matches ? matches[0].trim() : "";

      matches = singleRow
        .replace(phone, "")
        .trim()
        .match(/\s\w+\,.*$/gi);
      const name = matches
        ? matches[0]
            .trim()
            .replace(/\(apj\)/gi, "")
            .trim()
            .replace(/\(pj\)/gi, "")
            .trim()
        : "";
      const department = singleRow
        .replace(phone, "")
        .trim()
        .replace(name, "")
        .trim();
      const judge = {
        title: name.toLowerCase().includes("comm.") ? "Commissioner" : "Judge",
        name: _s.titleize(name.replace(/\(Comm.\)/gi, "").trim()),
        phone,
        courthouse: "",
        department,
      } as JudgeData;

      judges.push(judge);
    });

    judges.forEach((judge) => {
      if (judge.department.toLocaleLowerCase().includes("8 polk")) {
        judge.department = "8";
        judge.courthouse = "Polk Street Annex";
      } else if (
        (Number(judge.department) >= 1 && Number(judge.department) <= 5) ||
        (Number(judge.department) >= 9 && Number(judge.department) <= 29)
      ) {
        judge.department = "8";
        judge.courthouse = "Hall of Justice";
      } else {
        judge.courthouse = "Civic Center";
        if (judge.department.includes("/")) {
          const matches = judge.department.match(/^.*?(?=\/)/gi);
          judge.department = matches ? matches[0].trim() : "";
        }
        if (judge.department.includes(" ")) {
          const matches = judge.department.match(/^.*?(?=\s)/gi);
          judge.department = matches ? matches[0].trim() : "";
        }
      }
    });

    return judges;
  } catch (error) {
    console.log("judgesFromPdf Error: ", error);
    throw error;
  }
};

const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const extractData = (pages: PDFExtractPage[]) => {
  let txt = "";
  let height = 0;

  pages.forEach((page, i) => {
    const contents: PDFExtractText[] = page.content;
    height = 0; // refresh the height when meeting the new page
    contents.forEach((content) => {
      if (height !== content.y) {
        height = content.y;
        txt += "\n";
      }
      txt += content.str;
    });
    txt += "\f";
  });
  return txt;
};

export { solveHCaptcha, solveReCaptcha, judgesFromPdf, waitFor };
