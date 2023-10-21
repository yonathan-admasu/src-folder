import mongoose from "mongoose";
import { appConfig } from "../config/keys";
import Ruling from "../models/ruling";

// DB Config
mongoose
  .connect(appConfig.mongoURI)
  .then(async () => {
    try {
      const rulings = await Ruling.find().exec();
      for (let i = 0; i < rulings.length; i++) {
        // if (rulings[i].caseNumber == 'ALLCASES') {
        //   await Ruling.findByIdAndDelete(rulings[i].id)
        // }
        if (rulings[i].caseNumber.length <= 3) {
          console.log(`Removing case ${rulings[i].caseNumber}`);
          await Ruling.findByIdAndDelete(rulings[i].id);
        }
      }
      mongoose.disconnect();
    } catch (err) {
      console.error(err);
      mongoose.disconnect();
    }
  })
  .catch((err) => console.error(err));
