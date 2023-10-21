import mongoose, { ConnectOptions } from "mongoose";
import { bot } from "./bot";
import { saveRulings } from "../module_db/db";
import { scraperConfig } from "./utils/config";
import { appConfig } from "../../config/keys";

async function run() {
  try {
    await mongoose.connect(appConfig.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    } as ConnectOptions);
    console.log("MongoDB Connected...");

    const data = await bot.run();

    await saveRulings(data, scraperConfig.scraperName, true);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.log(
      `Bot ${scraperConfig.scraperName} failed to scrape site. Error: `,
      error
    );
    process.exit(1);
  }
}

run();
