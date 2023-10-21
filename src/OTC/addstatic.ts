import mongoose from "mongoose";
import { appConfig } from "../config/keys";
import Staticcontent from "../models/staticcontent";

// DB Config
mongoose
  .connect(appConfig.mongoURI)
  .then(async () => {
    try {
      console.log("MongoDB Connected...");
      const newStaticContent = new Staticcontent({
        welcome: "Welcome to",
        text: "Have you ever wanted insight into how your judge would rule on your motion? What does my judge think of the key issues? What rules or standards will my judge apply in analyzing the motion? What caselaw or arguments does my judge find persuasive?",
      });

      const sc = await newStaticContent.save();
      console.log(sc);
    } catch (err) {
      console.log(err);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => console.log(err));
