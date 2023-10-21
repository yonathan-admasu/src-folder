import { Request, Response } from "express";
import Staticcontent, { IStaticcontent } from "../models/staticcontent";
import Subscription, { ISubscription } from "../models/subscription";
import FAQ, { IFAQ } from "../models/faq";
import Ruling, { IRuling } from "../models/ruling";
import ContactUs from "../models/contactus";
import JudgeProfile from "../models/judgeprofile";
import * as cheerio from "cheerio";
import { isBot } from "../helpers/recaptcha";

// GET Display Home Page
const home_get = async (req: Request, res: Response) => {
  try {
    const staticcontent: IStaticcontent | null =
      await Staticcontent.findOne().exec();

    if (!staticcontent) {
      res.status(404).send("Static content not found");
      return false;
    }
    res.render("index/home", { staticcontent });
  } catch (error) {
    console.error("Error retrieving static content:", error);
    res.status(500).send("Failed to retrieve static content");
  }
  return true;
};

// GET contactus Page
const contactus_get = async (req: Request, res: Response) => {
  try {
    res.render("index/contactus");
  } catch (error) {
    console.error("Error rendering contact us page:", error);
    res.status(500).send("Failed to render contact us page");
  }
};

// Subscribe
const subscribe_post = async (req: Request, res: Response) => {
  try {
    const createdSub: ISubscription = new Subscription(req.body);
    await createdSub.save();
    res.send("success");
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).send("Failed to create subscription");
  }
};

// POST contactus
const contactus_post = async (req: Request, res: Response) => {
  const name = req.body.name.trim();
  const email = req.body.email.trim();
  const subject = req.body.subject.trim();
  const message = req.body.message.trim();
  const errors: { msg: string }[] = [];

  if (name === "" || email === "" || subject === "" || message === "") {
    errors.push({ msg: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.render("index/contactus", { errors, name, email, subject, message });
  } else {
    try {
      const isBotRes = await isBot(
        req.body["g-recaptcha-response"],
        req.connection.remoteAddress || ""
      );
      console.log(isBotRes);
      if (isBotRes === false) {
        const newContactus = new ContactUs({ name, email, subject, message });
        await newContactus.save();
        console.log("Saved Contact Us request in db...");
      } else {
        console.log(
          "*************** CONTACT US FORM IS SUBMITTED BY A BOT ***************"
        );
      }
      req.flash(
        "success_msg",
        "Thank you for contacting us, We will get back to you shortly."
      );
      res.redirect("/contactus");
    } catch (error) {
      console.error("Error saving contact us request:", error);
      res.status(500).send("Failed to save contact us request");
    }
  }
};

// GET FAQ Page
const faq_get = async (req: Request, res: Response) => {
  try {
    const faqs: IFAQ[] = await FAQ.find().exec();
    res.render("index/faq", { faqs });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).send("Failed to fetch FAQs");
  }
};

// GET Terms Page
const terms_get = async (req: Request, res: Response) => {
  try {
    res.render("index/terms");
  } catch (error) {
    console.error("Error rendering terms page:", error);
    res.status(500).send("Failed to render terms page");
  }
};

// GET Privacy Policy Page
const privacypolicy_get = async (req: Request, res: Response) => {
  try {
    res.render("index/privacypolicy");
  } catch (error) {
    console.error("Error rendering privacy policy page:", error);
    res.status(500).send("Failed to render terms page");
  }
};

// GET Ruling Page
const ruling_get = async (req: Request, res: Response) => {
  try {
    const { searchtext } = req.query;
    const { cn, m, d, y } = req.params;
    const ruling = await Ruling.findOne({
      caseNumber: cn,
      month: Number(m),
      day: Number(d),
      year: Number(y),
    });
    // const ruling = await Ruling.findById(req.params.rulingid);
    res.render("index/ruling", { ruling, searchtext });
  } catch (error) {
    console.error("Error retrieving ruling:", error);
    res.status(500).send("Failed to retrieve ruling");
  }
};

// GET Search Query and Fetch Results
const rulings_get = async (req: Request, res: Response): Promise<void> => {
  try {
    let page: number = req.query.page
      ? Number((req.query.page as string).trim())
      : 1;
    if (page < 1) page = 1;
    const limit: number = req.query.limit
      ? Number((req.query.limit as string).trim())
      : 20;
    const judge: string = req.query.judge
      ? (req.query.judge as string).trim()
      : "";
    const county: string = req.query.county
      ? (req.query.county as string).trim()
      : "";
    const year: string = req.query.year
      ? (req.query.year as string).trim()
      : "";
    const month: string = req.query.month
      ? (req.query.month as string).trim()
      : "";
    const searchtext: string = req.query.searchtext
      ? (req.query.searchtext as string).trim()
      : "";
    const casenumber: string = req.query.casenumber
      ? (req.query.casenumber as string).trim()
      : "";

    const mongoQuery = Ruling.find({ verified: true });

    if (casenumber !== "") {
      const cnRegEx = new RegExp(casenumber, "i");
      mongoQuery.where({ caseNumber: cnRegEx });
    }
    if (judge !== "") mongoQuery.where({ judge });
    if (county !== "") mongoQuery.where({ county });
    if (year !== "") mongoQuery.where({ year });
    if (month !== "") mongoQuery.where({ month });

    if (searchtext !== "") {
      console.log(searchtext);
      mongoQuery.where({ $text: { $search: searchtext } });
    }

    mongoQuery
      .select("-content")
      .populate({
        path: "judge department",
      })
      .sort({ hearingDate: -1 });

    const total: number = await Ruling.countDocuments(mongoQuery);
    const pages: number = Math.ceil(total / limit);

    const rulings: IRuling[] = await mongoQuery
      .skip(limit * (page - 1))
      .limit(limit)
      .exec();

    res.render("index/rulings", {
      rulings,
      page,
      limit,
      judge,
      county,
      year,
      month,
      casenumber,
      searchtext,
      total,
      pages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const judicialprofile_get = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let page = req.query.page ? Number(req.query.page) : 1;
    if (page < 1) page = 1;
    const limit = req.query.limit
      ? Number((req.query.limit as string).trim())
      : 20;
    const { slug } = req.params;

    const judgeProfile = await JudgeProfile.findOne({ slug }).populate("judge");
    if (judgeProfile) {
      const $ = cheerio.load(judgeProfile.profile);
      const metaDescriptionElement = $("p").contents().first();
      if (metaDescriptionElement) {
        const metaDescriptionText = metaDescriptionElement.text();
        if (metaDescriptionText) {
          const metaDescription = metaDescriptionText
            .replace(/"/gi, "")
            .trim()
            .match(/^(.*?(?<!\b\w)[.?!])\s+(?=[A-Z])/);
          if (metaDescription && metaDescription[0]) {
            const metaDescriptionTrimmed = metaDescription[0].trim();
            const rulingsQuery = Ruling.find({
              judge: judgeProfile.judge.id,
              verified: true,
            });
            rulingsQuery
              .select("-content")
              .populate({
                path: "judge department",
                populate: { path: "courthouse" },
              })
              .sort({ hearingDate: -1 });

            const total = await Ruling.countDocuments(rulingsQuery);
            const pages = Math.ceil(total / limit);

            const rulings = await rulingsQuery
              .skip(limit * (page - 1))
              .limit(limit)
              .exec();

            return res.render("index/judgeprofile", {
              judgeProfile,
              rulings,
              page,
              pages,
              total,
              limit,
              metaDescription: metaDescriptionTrimmed,
            });
          }
        }
      }
    }
    res.render("index/judgeprofile", {
      judgeProfile: null,
      rulings: null,
      page: 0,
      pages: 0,
      total: 0,
      limit: 0,
      metaDescription: "",
    });
  } catch (err) {
    // Exception handler
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

function searchContent(rulingContent: IRuling, searchterm: string): boolean {
  try {
    let found = false;
    let multipleTerms = true;
    let st = searchterm;
    if (!st.match(/".*?"/gi) || st.match(/".*?"/gi)!.length === 1) {
      multipleTerms = false;
      if (st.startsWith('"') && st.endsWith('"')) {
        st = st.slice(1, st.length - 1);
      }
    }
    if (!multipleTerms) {
      console.log("singleTerm");
      if (
        rulingContent.content.toLowerCase().includes(` ${st} `) ||
        rulingContent.content.toLowerCase().includes(` ${st}. `) ||
        rulingContent.content.toLowerCase().includes(`. ${st} `) ||
        rulingContent.content.toLowerCase().includes(` ${st}, `) ||
        rulingContent.content.toLowerCase().includes(`, ${st} `)
      ) {
        console.log("Matched Case Content");
        found = true;
      }
    } else {
      const middleTerm = st
        .match(/(?<=".*?").*(?=".*?")/g)![0]
        .trim()
        .toLowerCase();
      const multipleTermsRaw = st.match(/".*?"/gi);
      const multipleTermsText = multipleTermsRaw!.map((mt) =>
        mt.slice(1, mt.length - 1)
      );
      if (middleTerm === "and" || middleTerm === "&") {
        // console.log('Multiple Terms with &');
        found = multipleTermsText.every(
          (term) =>
            rulingContent.content.toLowerCase().includes(` ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}. `) ||
            rulingContent.content.toLowerCase().includes(`. ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}, `) ||
            rulingContent.content.toLowerCase().includes(`, ${term} `)
        );
      } else if (middleTerm === "or") {
        // console.log('Multiple Terms with or');
        found = multipleTermsText.some(
          (term) =>
            rulingContent.content.toLowerCase().includes(` ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}. `) ||
            rulingContent.content.toLowerCase().includes(`. ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}, `) ||
            rulingContent.content.toLowerCase().includes(`, ${term} `)
        );
        const foundBoth = multipleTermsText.every(
          (term) =>
            rulingContent.content.toLowerCase().includes(` ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}. `) ||
            rulingContent.content.toLowerCase().includes(`. ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}, `) ||
            rulingContent.content.toLowerCase().includes(`, ${term} `)
        );
        if (foundBoth) found = false;
      } else if (middleTerm === "no" || middleTerm === "not") {
        // console.log('Multiple Terms with no/not');
        const term1 = multipleTermsText[0];
        const term2 = multipleTermsText[1];
        const found1st =
          rulingContent.content.toLowerCase().includes(` ${term1} `) ||
          rulingContent.content.toLowerCase().includes(` ${term1}. `) ||
          rulingContent.content.toLowerCase().includes(`. ${term1} `) ||
          rulingContent.content.toLowerCase().includes(` ${term1}, `) ||
          rulingContent.content.toLowerCase().includes(`, ${term1} `);
        const found2nd =
          rulingContent.content.toLowerCase().includes(` ${term2} `) ||
          rulingContent.content.toLowerCase().includes(` ${term2}. `) ||
          rulingContent.content.toLowerCase().includes(`. ${term2} `) ||
          rulingContent.content.toLowerCase().includes(` ${term2}, `) ||
          rulingContent.content.toLowerCase().includes(`, ${term2} `);
        if (found1st && !found2nd) found = true;
      } else {
        found = multipleTermsText.some(
          (term) =>
            rulingContent.content.toLowerCase().includes(` ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}. `) ||
            rulingContent.content.toLowerCase().includes(`. ${term} `) ||
            rulingContent.content.toLowerCase().includes(` ${term}, `) ||
            rulingContent.content.toLowerCase().includes(`, ${term} `)
        );
      }
    }
    return found;
  } catch (error) {
    console.log(error);
  }
  return false;
}

export const IndexController = {
  home_get,
  contactus_get,
  subscribe_post,
  contactus_post,
  faq_get,
  terms_get,
  privacypolicy_get,
  ruling_get,
  rulings_get,
  judicialprofile_get,
};
