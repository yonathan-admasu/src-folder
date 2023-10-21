import { Router } from "express";
import { OldIndexController } from "../controllers/oldIndexController";

const router: Router = Router();

// @route   GET /welcome
// @desc    Show Welcome Page
// @access  Everyone
router.get("/", OldIndexController.welcome_get);

// @route   GET /contactus
// @desc    Go to Contact Us page
// @access  Public
router.get("/contactus", OldIndexController.contactus_get);

// @route   GET /faq
// @desc    Go to FAQ page
// @access  Everyone
router.get("/faq", OldIndexController.faq_get);

// @route   GET /privacypolicy
// @desc    Go to Privacy Policy Page
// @access  Everyone
router.get("/privacypolicy", OldIndexController.pp_get);

// @route   GET /terms
// @desc    Go to Terms and Conditions page
// @access  Everyone
router.get("/terms", OldIndexController.terms_get);

export const oldIndexRouter = router;
