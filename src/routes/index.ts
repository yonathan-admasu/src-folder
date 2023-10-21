import { Router } from "express";
import { IndexController } from "../controllers/indexController";
import { SearchMiddleware } from "../helpers/getdataforsearch";

const router: Router = Router();

// GET - Public - Show Home Page
router.get("/", SearchMiddleware.getAdvSearchData, IndexController.home_get);

// GET - Public - Show Home Page
router.get("/home", (req, res) => res.redirect("/"));

// GET - Public - Show FAQ Page
router.get("/faq", SearchMiddleware.getAdvSearchData, IndexController.faq_get);

// GET - Public - Show Terms Page
router.get(
  "/terms",
  SearchMiddleware.getAdvSearchData,
  IndexController.terms_get
);

// GET - Public - Show privacypolicy Page
router.get(
  "/privacypolicy",
  SearchMiddleware.getAdvSearchData,
  IndexController.privacypolicy_get
);

// GET - Public - Show contactus Page
router.get(
  "/contactus",
  SearchMiddleware.getAdvSearchData,
  IndexController.contactus_get
);

// POST - Public - Submit Contact Us Entry
router.post(
  "/contactus",
  SearchMiddleware.getAdvSearchData,
  IndexController.contactus_post
);

// POST - Public - Save subscription
router.post("/subscribe", IndexController.subscribe_post);

// GET - Public - Show Rulings
router.get(
  "/rulings",
  SearchMiddleware.getAdvSearchData,
  IndexController.rulings_get
);

// @route   GET /home/ruling
// @desc    Show Ruling Content
// @access  Private
router.get(
  "/ruling/:cn/:m/:d/:y",
  SearchMiddleware.getAdvSearchData,
  IndexController.ruling_get
);

// @route   GET /judicial-profile/:judge-slug
// @desc    Show Judicial Profile of Judge
// @access  Private
router.get(
  "/judicial-profile/:slug",
  SearchMiddleware.getAdvSearchData,
  IndexController.judicialprofile_get
);

export const indexRouter = router;
