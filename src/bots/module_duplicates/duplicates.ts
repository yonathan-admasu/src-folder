import logger from "../module_log/log";
import Ruling, { IRuling } from "../../models/ruling";

const removeDuplicates = async () => {
  try {
    await logger(
      "Remove Duplicates Module",
      "Started Removing Duplicates",
      "success"
    );
    let duplicateRulings = 0;
    const rulings: IRuling[] = await Ruling.find().select("-content");
    for (const [i, ruling] of rulings.entries()) {
      console.log(`${i + 1}/${rulings.length} - Looking for duplicates`);
      const duplicates: IRuling[] = await Ruling.find({
        caseNumber: rulings[i].caseNumber,
        month: rulings[i].month,
        day: rulings[i].day,
        year: rulings[i].year,
        judge: rulings[i].judge,
      })
        .select("-content")
        .sort({ createdAt: "desc" })
        .exec();

      if (duplicates.length > 1) {
        for (const [j, duplicate] of duplicates.entries()) {
          if (j == 0) continue;
          await Ruling.findByIdAndDelete(duplicate._id);
        }
        console.log(
          `Case Number ${rulings[i].caseNumber}, Found ${
            duplicates.length - 1
          } Duplicates and Removed...`
        );
        duplicateRulings = duplicateRulings + (duplicates.length - 1);
      }
    }
    await logger(
      "Remove Duplicates Module",
      `Finished Removing Duplicates, Duplicates Removed: ${duplicateRulings}`,
      "success"
    );
  } catch (error) {
    await logger(
      "Remove Duplicates Module",
      `Remove Duplicates: ${error}`,
      "error"
    );
    console.log(`Delete Duplicates Error: ${error}`);
  }
};

export default removeDuplicates;
