import { Request, Response, NextFunction } from "express";
import passport from "passport";
import moment from "moment";
import * as cheerio from "cheerio";
import httpStatus from "http-status";
import path from "path";
import fs from "fs";
import User, { IUser } from "../models/user";
import Subscription, { ISubscription } from "../models/subscription";
import ContactUs, { IContactUs } from "../models/contactus";
import ScraperLog, { IScraperLog } from "../models/scraperlog";
import County, { ICounty } from "../models/county";
import Judge, { IJudge } from "../models/judge";
import Courthouse, { ICourthouse } from "../models/courthouse";
import Department, { IDepartment } from "../models/department";
import Ruling, { IRuling } from "../models/ruling";
import Staticcontent from "../models/staticcontent";
import changeDate from "../helpers/changedateformat";
import FAQ from "../models/faq";
import JudgeProfile, { IJudgeProfile } from "../models/judgeprofile";

// Display Admin Homepage
const index_get = (req: Request, res: Response) => {
  res.render("admin/index");
};

// Show admin login form
const login_get = (req: Request, res: Response) => {
  res.render("admin/login");
};

// Login and Redirect to dashboard
const login_post = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/admin/login",
    failureFlash: true,
  })(req, res, next);
};

const editprofile_get = (req: Request, res: Response) => {
  res.render("admin/editprofile");
};

// POST Show Judge Profile Preview
const judgeprofilepreview_post = (req: Request, res: Response) => {
  const { judge, alternateName, slug, profile } = req.body;
  res.render("index/judgeprofile-preview", {
    judge,
    alternateName,
    slug,
    profile,
  });
};

// GET Show Admin Change Password Page
const changepassword_get = (req: Request, res: Response): void => {
  res.render("admin/changepassword");
};

// GET Show Add Admin Page
const admins_get = (req: Request, res: Response): void => {
  User.find({ isAdmin: true })
    .then((admins: IUser[]) => {
      res.render("admin/users/admins", { admins });
    })
    .catch((err: Error) => {
      // Handle any potential errors
      console.error(err);
      res.status(500).send("Error retrieving admins");
    });
};

const addadmin_get = (req: Request, res: Response): void => {
  res.render("admin/users/addadmin");
};

// POST Delete a particular User
const deleteuser_post = (req: Request, res: Response): void => {
  const { id } = req.params;
  User.findByIdAndDelete(id)
    .then(() => {
      res.send("success");
    })
    .catch((err: Error) => {
      // Handle any potential errors
      console.error(err);
      res.status(500).send("Error deleting user");
    });
};

// GET Show List of Subscribers
const subscribers_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const subscribers: ISubscription[] = await Subscription.find();
    res.render("admin/users/subscribers", { subscribers });
  } catch (err) {
    // Handle any potential errors
    console.error(err);
    res.status(500).send("Error retrieving subscribers");
  }
};

// POST Delete a particular Subscriber
const deletesubscriber_post = (req: Request, res: Response): void => {
  Subscription.findByIdAndDelete(req.params.id)
    .then(() => {
      res.send("success");
    })
    .catch((err) => {
      // Handle any potential errors
      console.error(err);
      res.status(500).send("Error deleting subscriber");
    });
};

// GET Show List of Messages
const messages_get = (req: Request, res: Response): void => {
  ContactUs.find()
    .sort({ createdat: -1 })
    .then((contactus: IContactUs[]) => {
      res.render("admin/users/contactus", { contactus });
    })
    .catch((err: Error) => {
      // Handle any potential errors
      console.error(err);
      res.status(500).send("Error retrieving messages");
    });
};

// GET Delete Message
const deletemessage_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { contactusid } = req.params; // Destructure the contactusid from req.params
  await ContactUs.findByIdAndDelete(contactusid); // Use await with findByIdAndDelete to delete the contactus by ID

  try {
    const contactus = await ContactUs.find().sort({ createdat: -1 });
    res.render("admin/users/contactus", { contactus });
  } catch (err) {
    // Handle any potential errors
    console.error(err);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("Error retrieving contactus");
  }
};

// Show Bots Logs Page
const botslogs_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const logs: IScraperLog[] = await ScraperLog.find()
      .sort({ createdAt: -1 })
      .exec();
    res.render("admin/botslogs", { logs });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in dbstats_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// POST Clear scrape logs
const clearlogs_post = async (req: Request, res: Response): Promise<void> => {
  try {
    await ScraperLog.deleteMany({});
    req.flash("success_msg", "Bots Logs Cleared...");
    res.redirect("/admin/botslogs");
  } catch (error) {
    // Handle any potential errors
    console.error("Error in dbstats_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// Show DB Stats Page
const dbstats_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const counties = await County.countDocuments().exec();
    const judges = await Judge.countDocuments().exec();
    const courthouses = await Courthouse.countDocuments().exec();
    const departments = await Department.countDocuments().exec();
    const rulings = await Ruling.countDocuments().exec();
    res.render("admin/dbstats", {
      counties,
      judges,
      courthouses,
      departments,
      rulings,
    });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in dbstats_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// Show Rulings Page
const rulings_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 500,
      newold = true,
      type = "all",
      county = "all",
    } = req.query;

    const pageInt: number = Number(page);
    const limitInt: number = Number(limit);
    const newoldBool: boolean = newold === true ? true : false;

    const mongoQuery = Ruling.find({ new: newoldBool }).select("-content");

    if (type === "verified") {
      mongoQuery.where({ verified: true });
    } else if (type === "unverified") {
      mongoQuery.where({ verified: false });
    } else if (type === "due") {
      const startDate = moment().subtract(10, "d").startOf("day");
      mongoQuery.where({ hearingDate: { $lte: startDate }, verified: false });
    } else if (type === "undue") {
      const startDate = moment().subtract(9, "d").startOf("day");
      mongoQuery.where({ hearingDate: { $gte: startDate }, verified: false });
    }

    if (county !== "all") {
      mongoQuery.where({ county });
    }

    const total: number = await Ruling.countDocuments(mongoQuery);
    const pages: number = Math.ceil(total / limitInt);

    const rulings: IRuling[] = await mongoQuery
      .skip(limitInt * (pageInt - 1))
      .limit(limitInt)
      .populate({
        path: "judge",
      })
      .populate({
        path: "department",
        populate: { path: "courthouse" },
      })
      .sort({ _id: -1 })
      .lean();

    const counties: ICounty[] = await County.find().sort({ name: "asc" });

    res.render("admin/rulings/rulings.ejs", {
      rulings,
      rulingsType: type,
      page: pageInt,
      limit: limitInt,
      total,
      pages,
      newold: newoldBool,
      county,
      counties,
    });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in rulings_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// GET Get All Courthouses
const courthouses_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const [courthouses, departments] = await Promise.all([
      Courthouse.find().sort({ name: 1 }).exec(),
      Department.find().sort({ name: 1 }).exec(),
    ]);
    // const rulings: IRuling[] = await Ruling.find().select('-content').sort({ _id: -1 }).exec(); // If needed
    res.render("admin/courthouses/courthouses.ejs", {
      courthouses,
      departments,
      // rulings,
    });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in courthouses_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// GET All Rulings For a Department
const departmentrulings_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const departmentId: string = req.params.departmentId;
    const [rulings, department] = await Promise.all([
      Ruling.find({ department: departmentId })
        .select("-content")
        .populate("department judge")
        .sort({ _id: -1 })
        .exec(),
      Department.findById(departmentId),
    ]);
    res.render("admin/departments/departmentrulings", { department, rulings });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in departmentrulings_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// GET Show Edit Courthouse Page for a particular courthouse
const editcourthouse_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const courthouse = await Courthouse.findById(req.params.id);
    const counties = await County.find().sort({ name: 1 }).exec();
    res.render("admin/courthouses/editch", { courthouse, counties });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in editcourthouse_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// POST Save Changes made to Courthouse
const editcourthouse_post = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const messages: string[] = [];
    const courthouse = await Courthouse.findById(req.params.id);
    const CHData = {
      name: req.body.name.trim(),
      address: req.body.address.trim(),
      county: req.body.county.trim(),
    };
    if (CHData.name === "") {
      messages.push("Courthouse must have a name");
      res.render("admin/courthouses/editch", {
        courthouse,
        messages,
      });
    } else {
      await Courthouse.findByIdAndUpdate(req.params.id, CHData);
      req.flash("success_msg", "Changes to Courthouse Saved Successfully...");
      res.redirect("/admin/courthouses");
    }
  } catch (error) {
    // Handle any potential errors
    console.error("Error in editcourthouse_post:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// GET Show Add Courthouse Page
const addcourthouse_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const counties = await County.find().sort({ name: 1 }).exec();
    res.render("admin/courthouses/addcourthouse", { counties });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in addcourthouse_get:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// POST Add Courthouse
const addcourthouse_post = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const messages: string[] = [];
    const courthouseData = {
      name: req.body.name.trim(),
      address: req.body.address.trim(),
      county: req.body.county.trim(),
    };
    if (courthouseData.name === "") {
      messages.push("Courthouse Name is required");
      res.render("admin/courthouses/addcourthouse", {
        messages,
        courthouse: courthouseData,
      });
    } else {
      const foundCourthouse = await Courthouse.findOne({
        name: courthouseData.name,
      }).exec();
      if (foundCourthouse === null) {
        const newCourthouse = new Courthouse(courthouseData);
        const createdCourthouse = await newCourthouse.save();
        req.flash(
          "success_msg",
          `Courthouse ${createdCourthouse.name} added Successfully`
        );
        res.redirect("/admin/courthouses");
      } else {
        messages.push("Courthouse Already Exist");
        res.render("admin/courthouses/addcourthouse", {
          messages,
          courthouse: courthouseData,
        });
      }
    }
  } catch (error) {
    // Handle any potential errors
    console.error("Error in addcourthouse_post:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// GET Delete Courthouse
const deletecourthouse_post = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foundDepartment = await Department.findOne({
      courthouse: req.params.id,
    });
    if (foundDepartment === null) {
      await Courthouse.findByIdAndDelete(req.params.id);
      req.flash("success_msg", "Courthouse Deleted");
    } else {
      req.flash(
        "error_msg",
        "Cannot delete Courthouse with Departments inside it"
      );
    }
    res.redirect("/admin/courthouses");
  } catch (error) {
    // Handle any potential errors
    console.error("Error in addcourthouse_post:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

// POST Delete a particular department
const deletedepartment_post = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const foundRulings = await Ruling.findOne({
      department: req.params.id,
    });
    if (foundRulings === null) {
      await Department.findByIdAndDelete(req.params.id);
      req.flash("success_msg", "Department Deleted...");
    } else {
      req.flash("error_msg", "Cannot delete Department with rulings inside it");
    }
    res.redirect("/admin/courthouses");
  } catch (error) {
    // Handle any potential errors
    console.log(error);
  }
};

// GET Get All Judges with Rulings
const judges_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const judges = await Judge.find().sort({ name: 1 }).exec();
    res.render("admin/judges/judges", { judges });
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// GET Get All Judges with Rulings
const judgerulings_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const judgeId = req.params.judgeid;
    const rulings = await Ruling.find({ judge: judgeId })
      .select("-content")
      .populate("department judge")
      .sort({ _id: -1 })
      .exec();
    const judge = await Judge.findById(judgeId);
    res.render("admin/judges/judgerulings", { judge, rulings });
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// GET Show Add Judge Page
const addjudge_get = (req: Request, res: Response): void => {
  res.render("admin/judges/addjudge");
};

// POST Save a Judge
const addjudge_post = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages: string[] = [];
    const judgeData = {
      name: req.body.name.trim(),
      title: req.body.title.trim(),
      phone: req.body.phone.trim(),
    };
    if (
      judgeData.name === "" ||
      judgeData.title === "" ||
      judgeData.phone === ""
    ) {
      messages.push("Something is missing, Please Fill in all fields.");
      res.render("admin/judges/addjudge", {
        messages,
        judge: judgeData,
      });
    } else {
      const foundJudge = await Judge.findOne({
        name: judgeData.name,
      }).exec();
      if (foundJudge === null) {
        const newJudge = new Judge(judgeData);
        await newJudge.save();
        req.flash("success_msg", `Judge ${newJudge.name} added Successfully`);
        res.redirect("/admin/judges");
      } else {
        messages.push("Judge Already Exist");
        res.render("admin/judges/addjudge", {
          messages,
          judge: judgeData,
        });
      }
    }
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// GET Show Edit Judge Page
const editjudge_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const foundJudge = await Judge.findById(req.params.id);
    res.render("admin/judges/editjudge", {
      judge: foundJudge,
    });
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// POST Save Changes to a Judge
const editjudge_post = async (req: Request, res: Response): Promise<void> => {
  try {
    const messages: string[] = [];
    const foundJudge = await Judge.findById(req.params.id);
    const judgeData = {
      name: req.body.name.trim(),
      title: req.body.title.trim(),
      phone: req.body.phone.trim(),
    };
    if (
      judgeData.name === "" ||
      judgeData.title === "" ||
      judgeData.phone === ""
    ) {
      messages.push("Something is missing. Please fill in all the fields.");
      res.render("admin/judges/editjudge", {
        messages,
        judge: foundJudge,
      });
    } else {
      await Judge.findByIdAndUpdate(req.params.id, judgeData);
      req.flash("success_msg", "Changes to Judge saved successfully");
      res.redirect("/admin/judges");
    }
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// POST Delete a particular Judge
const deletejudge_post = async (req: Request, res: Response): Promise<void> => {
  try {
    const foundRulings = await Ruling.find({
      judge: req.params.id,
    });
    if (foundRulings.length === 0) {
      await Judge.findByIdAndDelete(req.params.id);
      req.flash("success_msg", "Judge Deleted");
    } else {
      req.flash("error_msg", "Cannot delete Judge with associated rulings");
    }
    res.redirect("/admin/judges");
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// GET Get Ruling Content for ONE ruling
const ruling_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const ruling = await Ruling.findById(req.params.id)
      .populate({
        path: "judge department",
        populate: { path: "courthouse" },
      })
      .exec();
    res.render("admin/rulings/ruling", { ruling });
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// GET Show Add Rulings Page
const addrulings_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const judges = await Judge.find().sort({ name: 1 }).exec();
    const courthouses = await Courthouse.find().sort({ name: 1 }).exec();
    const departments = await Department.find();
    res.render("admin/rulings/addrulings", {
      judges,
      courthouses,
      departments,
    });
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// POST Add Rulings to Database
const addrulings_post = async (req: Request, res: Response): Promise<void> => {
  const { courthouse, department } = req.body;
  try {
    const foundCourthouse: ICourthouse | null = await Courthouse.findById(
      courthouse
    );
    const foundDepartment: IDepartment | null = await Department.findById(
      department
    );

    if (!req.files) {
      res.send("File was not found");
      return;
    }
    if (!foundCourthouse || !foundDepartment) {
      res.send("Can't find the courthouse or department");
      return;
    }

    let uploadedFileData = "";
    if (Array.isArray(req.files.rulingsfile)) {
      // Handle multiple files
      req.files.rulingsfile.forEach((file) => {
        uploadedFileData += file.data.toString("utf8");
      });
    } else {
      // Handle single file
      uploadedFileData = req.files.rulingsfile.data.toString("utf8");
    }

    const $ = cheerio.load(uploadedFileData);
    const rulingContentFull = $(".Print").html();
    const rulingContent = rulingContentFull
      ? /<p><b> Case Number:.*/gs.exec(rulingContentFull)?.[0] || ""
      : "";
    const casenumbers = rulingContent.match(
      /(?<=<p><b>\sCase Number:\s<\/b>\s)[A-Z0-9]*/g
    );
    const rulingFile = `${changeDate(req.body.date, "/").replace(
      /\//g,
      ""
    )}${foundCourthouse.name
      .replace(/\s/g, "")
      .toLowerCase()}${foundDepartment.name.toLowerCase()}.html`;
    const url = path.resolve(__dirname, `../content/rulings/${rulingFile}`);

    const rulingData = {
      date: changeDate(req.body.date, "/"),
      casenumbers,
      url: rulingFile,
      judge: req.body.judge,
      department: req.body.department,
    };

    const foundRuling = await Ruling.findOne({
      date: rulingData.date,
      department: rulingData.department,
      judge: rulingData.judge,
    });
    if (foundRuling == null) {
      const createdRuling = new Ruling(rulingData);
      await createdRuling.save();
      fs.writeFileSync(url, rulingContent);
      req.flash("success_msg", "Ruling Added Successfully");
      res.redirect("/admin");
    } else {
      // console.log(foundRuling);
      req.flash("error_msg", "Ruling Already exists");
      res.redirect("/admin");
    }
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// POST Delete a particular ruling
const deleteruling_post = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await Ruling.findByIdAndDelete(req.params.id);
    req.flash("success_msg", "Ruling Deleted Successfully...");
    res.redirect("/admin/rulings?type=all");
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// GET Show form for Changing Courthouse and Department of A particular Ruling
const editruling_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const ruling = await Ruling.findById(req.params.id)
      .select("-content")
      .populate({
        path: "judge",
      })
      .populate({
        path: "department",
        populate: {
          path: "courthouse",
        },
      })
      .exec();
    const judges = await Judge.find()
      .sort({
        name: 1,
      })
      .exec();
    const courthouses = await Courthouse.find()
      .sort({
        name: 1,
      })
      .exec();
    const departments = await Department.find()
      .sort({
        name: 1,
      })
      .exec();
    res.render("admin/rulings/editruling.ejs", {
      ruling,
      courthouses,
      departments,
      judges,
    });
  } catch (error) {
    // Handle any potential errors
    res.send(error);
  }
};

// POST Save Modifications to the ruling
const editruling_post = async (req: Request, res: Response): Promise<void> => {
  try {
    const { casenumber, hearingdate, verified, judge, department } = req.body;
    const dateObject = getDateObject(hearingdate);
    console.log(req.body);
    await Ruling.findByIdAndUpdate(req.params.id, {
      caseNumber: casenumber,
      month: dateObject.month,
      day: dateObject.day,
      year: dateObject.year,
      hearingDate: dateObject.date,
      verified: verified === "on",
      judge,
      department,
    });

    req.flash("success_msg", "Changes to Ruling Saved Successfully...");
    res.redirect(`/admin${req.path}`);
  } catch (error) {
    // Handle any potential errors
    console.log(error);
    res.send(error);
  }
};

function getDateObject(userDate: string) {
  const month = Number(userDate.match(/(?<=-)\d+(?=-)/i)![0]);
  const day = Number(userDate.match(/(?<=-)\d+$/i)![0]);
  const year = Number(userDate.match(/^\d+(?=-)/i)![0]);
  const date = moment(userDate, "YYYY-MM-DD").startOf("day").format();
  return { month, day, year, date };
}

// GET edit faq page
const pagefaq_get = async (req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await FAQ.find();
    res.render("admin/pages/faq", {
      faqs,
    });
  } catch (error) {
    // Handle any potential errors
    console.log(error);
    res.send(error);
  }
};

// POST Save changes made to faq page
const pagefaq_post = async (req: Request, res: Response): Promise<void> => {
  const messages: string[] = [];
  const { question, answer } = req.body; // Destructuring req.body
  const emptyQuestions: string[] = question.filter(
    (ques: string) => ques.trim().length === 0
  );
  const emptyAnswers: string[] = answer.filter(
    (ans: string) => ans.trim().length === 0
  );
  if (emptyQuestions.length === 0 && emptyAnswers.length === 0) {
    await FAQ.deleteMany();
    for (let i = 0; i < question.length; i++) {
      const newFAQ = new FAQ({
        question: question[i],
        answer: answer[i],
      });
      await newFAQ.save();
    }
    res.redirect("/admin/pages/faq");
  } else {
    messages.push("Fill in all fields first");
    const faqs = await FAQ.find();
    res.render("admin/pages/faq", {
      faqs,
      messages,
    });
  }
};

// POST Delete a FAQ
const pagefaqdelete_post = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    await FAQ.findByIdAndDelete(req.params.id);
    res.send("success");
  } catch (error) {
    // Handle any potential errors
    console.error(`Error deleting FAQ: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

// GET edit Home page
export const pagehome_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const staticcontent = await Staticcontent.findOne(); // Use findOne instead of find to get a single document
    res.render("admin/pages/homecontent", { staticcontent });
  } catch (error) {
    // Handle any potential errors
    console.error(`Error retrieving static content: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

// POST Save changes made to home page
const pagehome_post = async (req: Request, res: Response): Promise<void> => {
  try {
    const { welcome, text } = req.body; // Destructure req.body to extract welcome and text properties

    if (!welcome.trim() || !text.trim()) {
      req.flash(
        "error_msg",
        "Welcome Message and Welcome text must not be empty..."
      );
      res.redirect("/admin/pages/home");
    } else {
      const sc = await Staticcontent.findOne();
      if (!sc) {
        throw new Error("Staticcontent not found");
      }
      await Staticcontent.findByIdAndUpdate(sc._id, {
        welcome: welcome.trim(),
        text: text.trim(),
      });
      res.redirect("/admin/pages/home");
    }
  } catch (error) {
    // Handle any potential errors
    console.error(`Error updating static content: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

// GET Show Judge Profiles Page
const judgeprofiles_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const profiles: IJudgeProfile[] = await JudgeProfile.find()
      .populate("judge")
      .sort({ alternateName: "asc" })
      .exec();
    res.render("admin/pages/judgeprofiles", { profiles });
  } catch (error) {
    // Handle any potential errors
    console.error(`Error fetching judge profiles: ${error}`);
    res.status(500).send("Internal Server Error");
  }
};

// GET Show Add Judge Profile Page
const addjudgeprofile_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const allJudges = await Judge.find().sort({ name: "asc" });
    const judgeProfiles = await JudgeProfile.find();
    const judges = allJudges.filter(
      (judge) => !judgeProfiles.some((jp) => jp.judge == judge.id)
    );
    res.render("admin/pages/add-judge-profile", { judges });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in addJudgeProfile_get:", error);
    res.status(500).send("Internal Server Error");
  }
};

// POST Add Judge Profile
const addjudgeprofile_post = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { judge, alternateName, slug, profile, published } = req.body;

    if (!judge || !alternateName || !slug || !profile) {
      req.flash("error_msg", "Please Fill in all fields...");
      return res.redirect("/admin/pages/add-judge-profile");
    }

    const newJudgeProfile = new JudgeProfile({
      judge,
      alternateName,
      slug,
      profile,
      published,
    });
    await newJudgeProfile.save();

    req.flash("success_msg", "Added Judge Profile...");
    res.redirect("/admin/pages/judge-profiles");
  } catch (error) {
    // Handle any potential errors
    console.error("Error in addJudgeProfile_post:", error);
    res.status(500).send("Internal Server Error");
  }
};

// GET Delete a Judge Profile
const deletejudgeprofile_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await JudgeProfile.findByIdAndDelete(id);
    req.flash("success_msg", "Judge Profile Deleted...");
    res.redirect("/admin/pages/judge-profiles");
  } catch (error) {
    // Handle any potential errors
    console.error("Error in deleteJudgeProfile_get:", error);
    res.status(500).send("Internal Server Error");
  }
};

// GET Show Edit a Judge Profile Page
const editjudgeprofile_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const judgeProfile = await JudgeProfile.findById(id).populate("judge");

    if (!judgeProfile) {
      // If judgeProfile is null, throw an error
      throw new Error("Judge Profile not found");
    }

    const judge: IJudge | null = await Judge.findById(judgeProfile.judge.id);

    if (!judge) {
      // If judge is null, throw an error
      throw new Error("Judge not found");
    }

    const allJudges: IJudge[] = await Judge.find().sort({ name: "asc" });
    const judgeProfiles: IJudgeProfile[] = await JudgeProfile.find();
    const judges = allJudges.filter(
      (judge) => !judgeProfiles.some((jp) => jp.judge == judge.id)
    );
    judges.unshift(judge);

    res.render("admin/pages/edit-judge-profile", { judgeProfile, judges });
  } catch (error) {
    // Handle any potential errors
    console.error("Error in editJudgeProfile_get:", error);
    res.status(500).send("Internal Server Error");
  }
};

// POST Edit a Judge Profile
const editjudgeprofile_post = async (req: Request, res: Response) => {
  try {
    const { id, judge, alternateName, slug, profile }: IJudgeProfile = req.body; // Destructure the request body and type it with IJudgeProfile interface

    if (!judge || !alternateName || !slug || !profile) {
      req.flash("error_msg", "Please fill in all fields...");
      return res.redirect(`/admin/pages/edit-judge-profile/${id}`);
    }

    await JudgeProfile.findByIdAndUpdate(id, {
      judge,
      alternateName,
      slug,
      profile,
    });

    req.flash("success_msg", "Judge Profile Updated...");
    res.redirect("/admin/pages/judge-profiles");
  } catch (err) {
    // Handle any potential errors
    console.error("Error updating judge profile:", err);
    req.flash(
      "error_msg",
      "Failed to update judge profile. Please try again later."
    );
    res.redirect("/admin/pages/judge-profiles");
  }
};

// GET Chnage Judge Profile Publish Status
const publishjudgeprofile_get = async (req: Request, res: Response) => {
  try {
    const { id, value } = req.params;
    await JudgeProfile.findByIdAndUpdate(id, { published: value });
    res.send("Done");
  } catch (err) {
    console.error("Error updating judge profile:", err);
    res
      .status(500)
      .send("Failed to update judge profile. Please try again later.");
  }
};

// GET Show Split rulings page
const splitrulings_get = async (req: Request, res: Response) => {
  try {
    const judges = await Judge.find().sort({ name: 1 }).exec();
    const courthouses = await Courthouse.find().sort({ name: 1 }).exec();
    const departments = await Department.find();
    const ruling = await Ruling.findById(req.params.id)
      .populate({
        path: "judge department",
        populate: {
          path: "courthouse",
        },
      })
      .exec();

    res.render("admin/rulings/splitrulings", {
      judges,
      courthouses,
      departments,
      ruling,
    });
  } catch (err) {
    console.error("Error fetching data for split rulings:", err);
    res
      .status(500)
      .send("Failed to fetch data for split rulings. Please try again later.");
  }
};

// POST Save splitted rulings
// const splitrulings_post = async (req: Request, res: Response) => {
//   try {
//     const ruling: IRuling | null = await Ruling.findById(req.params.id);
//     if (!ruling) {
//       return res.status(404).send({ error: "Ruling not found" });
//     }

//     const rulingURL = path.resolve(
//       __dirname,
//       `../content/rulings/${ruling.url}`
//     );
//     const rulingContent = fs.readFileSync(rulingURL, "utf8");

//     const foundRuling = await Ruling.findOne({
//       date: ruling.date,
//       department: req.body.department2,
//     });

//     if (!foundRuling) {
//       fs.unlinkSync(rulingURL);

//       await splitSaveRuling(
//         req.params.id,
//         rulingContent,
//         req.body["casenumbers1[]"],
//         req.body.judge1,
//         req.body.courthouse1,
//         req.body.department1
//       );

//       await splitSaveRuling(
//         req.params.id,
//         rulingContent,
//         req.body["casenumbers2[]"],
//         req.body.judge2,
//         req.body.courthouse2,
//         req.body.department2
//       );

//       await Ruling.findByIdAndDelete(req.params.id);

//       req.flash("success_msg", "Rulings splitted successfully...");
//       res.status(200).send({ success: "Splitted Successfully" });
//     } else {
//       res.status(500).send({ error: "Ruling already exists..." });
//     }
//   } catch (error) {
//     console.error("Error splitting rulings:", error);
//     res
//       .status(500)
//       .send({ error: "Failed to split rulings. Please try again later." });
//   }
// };

// Show add department page
const adddepartment_get = async (req: Request, res: Response) => {
  try {
    const courthouses = await Courthouse.find().sort({ name: 1 }).exec();
    res.render("admin/departments/adddepartment", { courthouses });
  } catch (error) {
    console.error("Error fetching courthouses:", error);
    res
      .status(500)
      .send({ error: "Failed to fetch courthouses. Please try again later." });
  }
};

// Add a new department
const adddepartment_post = async (req: Request, res: Response) => {
  try {
    const messages: string[] = [];
    const courthouses = await Courthouse.find().sort({ name: 1 }).exec();
    const newDepartment = {
      name: req.body.name.trim(),
      courthouse: req.body.courthouse,
      alias: req.body.alias.trim(),
    };

    const foundDepartment = await Department.findOne({
      courthouse: newDepartment.courthouse,
      name: { $regex: newDepartment.name, $options: "i" },
    });

    if (newDepartment.name === "") {
      messages.push("Department must have a name");
    }

    if (foundDepartment) {
      messages.push("Department already exists");
    }

    if (messages.length > 0) {
      res.render("admin/departments/adddepartment", {
        messages,
        courthouses,
      });
    } else {
      const createdDepartment = new Department(newDepartment);
      await createdDepartment.save();
      res.render("admin/departments/adddepartment", {
        courthouses,
        success_msg: "Department added successfully...",
      });
    }
  } catch (error) {
    console.error("Error adding department:", error);
    res
      .status(500)
      .send({ error: "Failed to add department. Please try again later." });
  }
};

// Data type definitions for parameters
/**
 * @param {string} rulingID - ID of the ruling document in the database
 * @param {string} rulingContent - Content of the ruling to be split and saved
 * @param {(string|string[]|number[])} casenumbers - Case numbers to be used for splitting the ruling content
 * @param {string} judge - ID of the judge associated with the ruling
 * @param {string} courthouse - ID of the courthouse associated with the ruling
 * @param {string} department - ID of the department associated with the ruling
 */
const splitSaveRuling = async (
  rulingID,
  rulingContent,
  casenumbers,
  judge,
  courthouse,
  department
) => {
  try {
    // Retrieve ruling, courthouse, and department data
    const ruling: IRuling | null = await Ruling.findById(rulingID)
      .populate("department judge")
      .exec();
    const foundCourthouse: ICourthouse | null = await Courthouse.findById(
      courthouse
    );
    const foundDepartment: IDepartment | null = await Department.findById(
      department
    );

    // Handle case where ruling is null
    if (!ruling || !foundCourthouse || !foundDepartment) {
      throw new Error(`Ruling, Courthouse, or Department with ID not found`);
    }

    // Generate ruling file name and URL
    const rulingFile = `${ruling.date.replace(/\//g, "")}${foundCourthouse.name
      .replace(/\s/g, "")
      .toLowerCase()}${foundDepartment.name.toLowerCase()}.html`;
    const url = path.resolve(__dirname, `../content/rulings/${rulingFile}`);

    let content = "";
    if (typeof casenumbers !== "string") {
      for (let i = 0; i < casenumbers.length; i++) {
        const regex = new RegExp(
          `<b>\\sCase Number:\\s</b>\\s${casenumbers[i]}.+?<hr>`,
          "gs"
        );
        const match = rulingContent.match(regex);
        if (match) {
          content += match[0];
        }
      }
    } else {
      const regex = new RegExp(
        `<b>\\sCase Number:\\s</b>\\s${casenumbers}.+?<hr>`,
        "gs"
      );
      const match = rulingContent.match(regex);
      if (match) {
        content += match[0];
      }
    }

    await fs.promises.writeFile(url, content);

    const rulingData = {
      date: ruling.date,
      casenumbers: casenumbers,
      url: rulingFile,
      judge: judge,
      department: department,
    };

    const newRuling = new Ruling(rulingData);
    const createdRuling = await newRuling.save();

    return createdRuling;
  } catch (error) {
    console.error("Error splitting and saving ruling:", error);
    throw error;
  }
};

// POST Change allow copy of a particular user
const changeallowcopy_post = async (req: Request, res: Response) => {
  try {
    const { id, value } = req.params;

    // Validate and sanitize input
    if (!id || !value) {
      return res.status(400).send("Invalid request");
    }

    // Update user document in the database
    const updatedUser: IUser | null = await User.findByIdAndUpdate(id, {
      allowcopy: value,
    });

    if (updatedUser) {
      res.send("Success"); // Send success response
    } else {
      res.status(404).send("User not found"); // Send error response if user not found
    }
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send("Failed to update user"); // Send error response
  }
};

// POST Set Verify Enable or Disable a ruling
const verifyruling_post = async (req: Request, res: Response) => {
  try {
    const { id, status } = req.params;

    // Validate and sanitize input
    if (!id || !status) {
      return res.status(400).send("Invalid request");
    }

    // Update ruling document in the database
    await Ruling.findByIdAndUpdate(id, { verified: status });

    res.send("done"); // Send success response
  } catch (error) {
    console.error("Error verifying ruling:", error);
    res.status(500).send("Failed to verify ruling"); // Send error response
  }
};

export const AdminController = {
  index_get,
  login_get,
  login_post,
  editprofile_get,
  judgeprofilepreview_post,
  changepassword_get,
  admins_get,
  addadmin_get,
  deleteuser_post,
  subscribers_get,
  deletesubscriber_post,
  messages_get,
  deletemessage_get,
  botslogs_get,
  clearlogs_post,
  dbstats_get,
  rulings_get,
  courthouses_get,
  departmentrulings_get,
  editcourthouse_get,
  editcourthouse_post,
  addcourthouse_get,
  addcourthouse_post,
  deletecourthouse_post,
  deletedepartment_post,
  judges_get,
  judgerulings_get,
  addjudge_get,
  addjudge_post,
  editjudge_get,
  editjudge_post,
  deletejudge_post,
  ruling_get,
  addrulings_get,
  addrulings_post,
  deleteruling_post,
  editruling_get,
  editruling_post,
  pagefaq_get,
  pagefaq_post,
  pagefaqdelete_post,
  pagehome_get,
  pagehome_post,
  judgeprofiles_get,
  addjudgeprofile_get,
  addjudgeprofile_post,
  deletejudgeprofile_get,
  editjudgeprofile_get,
  editjudgeprofile_post,
  publishjudgeprofile_get,
  splitrulings_get,
  // splitrulings_post,
  adddepartment_get,
  adddepartment_post,
  changeallowcopy_post,
  verifyruling_post,
};
