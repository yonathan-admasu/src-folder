import County, { ICounty } from "../../models/county";
import Courthouse, { ICourthouse } from "../../models/courthouse";
import Department, { IDepartment } from "../../models/department";
import Judge, { IJudge } from "../../models/judge";
import Ruling, { IRuling } from "../../models/ruling";
import { JudgeData, RulingData } from "../module_type/types";
import logger from "../module_log/log";

let newRulingsCount = 0;
let updatedRulingsCount = 0;
const excludedCaseNumbers: string[] = [];

const saveRulings = async (
  rulingsData: RulingData[],
  scraperName: string,
  verified = false
): Promise<void> => {
  try {
    await logger(scraperName, "Started Saving to DB", "success");

    for (const [i, rulingData] of rulingsData.entries()) {
      if (!excludedCaseNumbers.includes(rulingData.caseNumber)) {
        console.log(`${i + 1}/${rulingsData.length} - Saving Ruling...`);
        await saveRuling(rulingData, verified);
      }
    }

    await logger(
      scraperName,
      `Finished Saving to DB, ${newRulingsCount} New Rulings Added, ${updatedRulingsCount} Rulings Updated`,
      "success"
    );
  } catch (error) {
    await logger(scraperName, `Saving to DB Error: ${error}`, "error");
    console.log(`Saving to DB Error: ${error}`, "error");
    return Promise.reject(error);
  }
};

const saveRuling = async (
  rulingData: RulingData,
  verified: boolean = false
) => {
  try {
    const judge = await saveJudge(rulingData);
    const county = await saveCounty(rulingData);
    const CH = await saveCourthouse(rulingData, county);
    const dept = await saveDepartment(rulingData, CH);
    await saveRulingDoc(rulingData, judge, dept, county, verified);
    return "Ruling Saved...";
  } catch (error) {
    throw error;
  }
};

const saveJudge = async (rulingData: RulingData): Promise<IJudge> => {
  try {
    if (rulingData.judge) {
      const foundJudge = await Judge.findOne({
        name: (rulingData.judge as JudgeData).name,
      }).exec();
      if (!foundJudge) {
        const newJudge = new Judge({
          name: (rulingData.judge as JudgeData).name,
          title: (rulingData.judge as JudgeData).title,
          phone: (rulingData.judge as JudgeData).phone,
        });
        const createdJudge = await newJudge.save();
        console.log("New Judge Created");
        return createdJudge;
      } else {
        console.log("Judge Already Exists");
        return foundJudge;
      }
    } else {
      const foundJudge = await Judge.findOne({ name: "Unassigned" }).exec();
      if (!foundJudge) {
        const newJudge = new Judge({
          name: "Unassigned",
          title: "",
          phone: "",
        });
        const createdJudge = await newJudge.save();
        return createdJudge;
      } else {
        return foundJudge;
      }
    }
  } catch (error) {
    console.log("Judge Save Error: ", error);
    throw error;
  }
};

const saveCounty = async (rulingData: RulingData): Promise<ICounty> => {
  try {
    let foundCounty: ICounty | null = await County.findOne({
      name: rulingData.county,
    }).exec();
    if (!foundCounty) {
      foundCounty = new County({
        name: rulingData.county,
      });
      await foundCounty.save();
      console.log("New County Created");
    } else {
      // console.log('County Already Exists');
    }
    return foundCounty;
  } catch (error) {
    console.log("County Save Error: ", error);
    throw error;
  }
};

const saveCourthouse = async (
  rulingData: RulingData,
  county: ICounty
): Promise<ICourthouse> => {
  try {
    let foundCH = await Courthouse.findOne({
      name: rulingData.courthouse,
    }).exec();
    if (!foundCH) {
      const newCH = new Courthouse({
        name: rulingData.courthouse,
        address: rulingData.address || "",
        county: county._id,
      });
      foundCH = await newCH.save();
      console.log("New Courthouse Created");
    }
    return foundCH;
  } catch (error) {
    console.log("Courthouse Save Error: ", error);
    throw error;
  }
};

const saveDepartment = async (
  rulingData: RulingData,
  CH: ICourthouse
): Promise<IDepartment> => {
  try {
    const foundDept = await Department.findOne({
      name: rulingData.department,
      courthouse: CH._id,
    }).exec();
    if (!foundDept) {
      const newDept = new Department({
        name: rulingData.department,
        alias: rulingData.alias || "",
        courthouse: CH._id,
      });
      await newDept.save();
      console.log("New Department Created");
      return newDept;
    } else {
      // console.log('Department Already Exists');
      return foundDept;
    }
  } catch (error) {
    console.log("Department Save Error: ", error);
    throw error;
  }
};

const saveRulingDoc = async (
  rulingData: RulingData,
  judge: IJudge,
  dept: IDepartment,
  county: ICounty,
  verified = false
): Promise<void> => {
  try {
    const foundRuling: IRuling | null = await Ruling.findOne({
      caseNumber: rulingData.caseNumber,
      month: rulingData.month,
      day: rulingData.day,
      year: rulingData.year,
      department: dept._id,
      judge: judge._id,
    }).exec();
    if (!foundRuling) {
      const { caseNumber, content, month, day, year, hearingDate } = rulingData;
      const newRuling: IRuling = new Ruling({
        caseNumber,
        content,
        month,
        day,
        year,
        judge: judge._id,
        department: dept._id,
        verified,
        hearingDate,
        new: true,
        county: county._id,
      });
      await newRuling.save();
      console.log("New Ruling Created");
      newRulingsCount++; // Update the appropriate variable for tracking new rulings
      return;
    }
    console.log("Ruling Already Exists.. Updating content");
    await Ruling.updateOne(
      {
        _id: foundRuling._id,
      },
      {
        content: rulingData.content,
      }
    );
    updatedRulingsCount++; // Update the appropriate variable for tracking updated rulings
  } catch (error) {
    console.log("Ruling Save Error: ", error);
  }
};

export { saveRulings, saveJudge };
