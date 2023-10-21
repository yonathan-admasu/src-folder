import mongoose, { Document } from "mongoose";
import { appConfig } from "../config/keys";
import Ruling, { IRuling } from "../models/ruling";

// DB Config
mongoose
  .connect(appConfig.mongoURI)
  .then(async () => {
    try {
      const rulings: IRuling[] = await Ruling.find().exec();
      for (let i = 0; i < rulings.length; i++) {
        if (rulings[i].verified) {
          await Ruling.findByIdAndUpdate(rulings[i].id, {
            published: true,
          });
        }
      }
      mongoose.connection.close();
    } catch (err) {
      console.log(err);
    }
  })
  .catch((err) => console.log(err));
