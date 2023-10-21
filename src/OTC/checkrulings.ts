import mongoose from "mongoose";
import { appConfig } from "../config/keys";
import Ruling from "../models/ruling";

// DB Config
mongoose
  .connect(appConfig.mongoURI)
  .then(async () => {
    const rulings = await Ruling.find();
    let verified = 0;
    let unVerified = 0;
    let other = 0;
    for (let i = 0; i < rulings.length; i++) {
      if (rulings[i].verified === true) verified++;
      else if (rulings[i].verified === false) unVerified++;
      else other++;
    }
    console.log("Verified:", verified);
    console.log("Unverified:", unVerified);
    console.log("Other:", other);
  })
  .catch((err) => console.log(err));
