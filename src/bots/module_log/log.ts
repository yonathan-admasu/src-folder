import ScraperLog from "../../models/scraperlog";

const logger = async (
  scraperName: string,
  logText: string,
  logType: string
): Promise<boolean> => {
  try {
    const newScraperLog = new ScraperLog({
      scraperName,
      logText,
      logType,
    });
    await newScraperLog.save();
    console.log("Log...", scraperName, "...", logText, "...", logType);
    return true;
  } catch (error) {
    console.log(`Save Log Error: ${error}`);
    throw error;
  }
};

export default logger;
