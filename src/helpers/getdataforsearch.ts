import _ from "underscore";
import { Request, Response, NextFunction } from "express";
import Judge from "../models/judge";
import JudgeProfile from "../models/judgeprofile";
import County from "../models/county";

const getAdvSearchData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const judges = await Judge.find({ name: { $ne: "Unassigned" } })
      .sort({ name: 1 })
      .exec();
    let judgeProfiles = await JudgeProfile.find({ published: true })
      .populate("judge")
      .exec();
    judgeProfiles = _.sortBy(judgeProfiles, (obj) => obj.judge.name);
    const counties = await County.find().sort({ name: "asc" }).exec();
    const searchdata = { judges, judgeProfiles, counties };
    res.locals.searchdata = searchdata;
    next();
  } catch (err) {
    // Add your error handling logic here
    console.error("Error in searchMiddleware:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const SearchMiddleware = { getAdvSearchData };
