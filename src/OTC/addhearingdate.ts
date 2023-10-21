import mongoose from "mongoose";
import moment from "moment";
import { appConfig } from "../config/keys";
import Ruling from "../models/ruling";

// DB Config
mongoose
  .connect(appConfig.mongoURI)
  .then(async () => {
    try {
      const rulings = await Ruling.find();
      for (let i = 0; i < rulings.length; i++) {
        const dt = moment(rulings[i].date, "MM/DD/YYYY").format();
        console.log(`Updating ${i + 1}/${rulings.length}`);
        await Ruling.findByIdAndUpdate(rulings[i]._id, { hearingDate: dt });
      }
      console.log("Update complete.");
    } catch (err) {
      console.log(err);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => console.log(err));
