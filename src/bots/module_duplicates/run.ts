import mongoose, { ConnectOptions } from "mongoose";
import { appConfig } from "../../config/keys";
import removeDuplicates from "./duplicates";

async function run() {
  try {
    await mongoose.connect(appConfig.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    } as ConnectOptions);
    console.log("MongoDB Connected...");
    await removeDuplicates();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.log("Duplicates Removal Module failed to run.. Error : ", error);
    process.exit(1);
  }
}

run();
