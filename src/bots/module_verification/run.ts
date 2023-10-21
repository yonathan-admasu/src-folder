import mongoose, { ConnectOptions } from "mongoose";
import { appConfig } from "../../config/keys";
import verifyRulings from "./verify";

async function run() {
  try {
    await mongoose.connect(appConfig.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    } as ConnectOptions);
    console.log("MongoDB Connected...");
    await verifyRulings();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.log("Verification Module failed to run.. Error : ", error);
  }
}

run();
