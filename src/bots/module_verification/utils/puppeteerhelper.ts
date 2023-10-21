import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from "puppeteer";
import { CustomNavigator } from "../../module_type/customNavigator";

const launchBrowser = async (headless: boolean): Promise<Browser> => {
  try {
    const launchOptions: PuppeteerLaunchOptions = {
      headless,
      args: [
        "--disable-setuid-sandbox",
        "--no-sandbox",
        "--disable-infobars",
        "--window-position=0,0",
        "--ignore-certifcate-errors",
        "--ignore-certifcate-errors-spki-list",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: null,
    };
    const browser = await puppeteer.launch(launchOptions);
    return browser;
  } catch (error) {
    console.log("Browser Launch Error: ", error);
    throw error;
  }
};

const launchPage = async (
  browser: Browser,
  blockResources: boolean
): Promise<Page> => {
  try {
    // Create New Page
    const page = await browser.newPage();

    // Set user agent for page.
    const userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36";
    await page.setUserAgent(userAgent);

    // Pass the Webdriver Test.
    await page.evaluateOnNewDocument(() => {
      const navigator = new CustomNavigator();
      navigator.webdriver = false;
      navigator.languages = ["en-US", "en"];
      navigator.plugins = [1, 2, 3, 4, 5];
    });

    if (blockResources) {
      const blockedResources = [
        "image",
        "stylesheet",
        "media",
        "font",
        "texttrack",
        "object",
        "beacon",
        "csp_report",
        "imageset",
      ];

      // Set Request Interception to avoid receiving images, fonts and stylesheets for fast speed
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        if (blockedResources.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });
    }

    // Set Extra Header for request
    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.8",
    });

    return page;
  } catch (error) {
    console.log("Launch Page Error: ", error);
    throw error;
  }
};

const getAttr = async (
  selector: string,
  attribute: string,
  page: Page
): Promise<string> => {
  try {
    const elementHandle = await page.$(selector);
    if (elementHandle) {
      const attr = await elementHandle.evaluate((elm, attribute) => {
        const value = elm.getAttribute(attribute);
        return value ? value.trim() : "";
      }, attribute);
      return attr;
    } else {
      console.log(`Node not found`);
      return "";
    }
  } catch (error) {
    console.log(`getAttr Error: ${error}`);
    throw error;
  }
};

export { launchBrowser, launchPage, getAttr };
