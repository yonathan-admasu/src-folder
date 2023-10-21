import { NextFunction, Request, Response } from "express";

const ensureAuthenticatedAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === "DEVELOPMENT") return next();
  if (req.isAuthenticated()) {
    // if (req.user.isAdmin === true) {
    //   return next();
    // }
    req.logout(() => console.log("---logout---"));
    req.flash("error_msg", "Login as Administrator to continue");
    res.redirect("/admin/login");
  }
  req.flash("error_msg", "Please Login to view Admin Dashboard");
  res.redirect("/admin/login");
};

const ensureAuthenticatedAdminLogin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // if (req.isAuthenticated()) {
  //   if (req.user.isAdmin === true) {
  //     res.redirect("/admin");
  //   }
  // }
  return next();
};

export const AuthMiddleware = {
  ensureAuthenticatedAdmin,
  ensureAuthenticatedAdminLogin,
};
