import { Page } from "puppeteer";
import axios from "axios";
import { getAttr } from "./puppeteerhelper";
import { CaptchaResponse, JudgeData } from "../../module_type/types";
import { scraperConfig } from "./config";

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

const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const convertJudgeName = (judgeName: string) => {
  const firstMatches = judgeName.match(/^.*?(?=,)/gi);
  const secondMatches = judgeName.match(/(?<=^.*?,).*$/gi);
  if (!firstMatches || !secondMatches) {
    return null;
  }
  const firstPart = firstMatches[0].trim();
  const lastPart = secondMatches[0].trim();
  const newJudgeName = lastPart + " " + firstPart;
  return newJudgeName;
};

export const utils = {
  solveHCaptcha,
  solveReCaptcha,
  waitFor,
  convertJudgeName,
};
