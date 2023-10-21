import { Request, Response } from "express";

// Display Welcome Page
const welcome_get = (req: Request, res: Response): void => {
  res.redirect("/home");
};

// Display Contact Us Page
const contactus_get = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect("/home/contactus");
  } catch (err) {
    // handle error
  }
};

// Display FAQ Page
const faq_get = async (req: Request, res: Response): Promise<void> => {
  try {
    res.redirect("/home/faq");
  } catch (err) {
    // handle error
  }
};

// Display Privacy Policy Page
const pp_get = (req: Request, res: Response): void => {
  res.redirect("/home/privacypolicy");
};

// Display Terms and Conditions Page
const terms_get = (req: Request, res: Response): void => {
  res.redirect("/home/terms");
};

export const OldIndexController = {
  welcome_get,
  contactus_get,
  faq_get,
  pp_get,
  terms_get,
};
