import dotenv from "dotenv";
import express, { Request, Response, NextFunction, Application } from "express";
import httpStatus from "http-status";
import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import passport from "passport";
import session from "express-session";
import serveFavicon from "serve-favicon";
import flash from "connect-flash";
import fileUpload from "express-fileupload";
import connectDB from "./helpers/dbconnect";

import User from "./models/user";

import { adminRouter } from "./routes/admin";
import { indexRouter } from "./routes";
import { oldIndexRouter } from "./routes/oldindex";

dotenv.config();

const app: Application = express();

// DB Config
connectDB();

if (process.env.NODE_ENV !== "DEVELOPMENT") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.secure) {
      // request was via https, so do no special handling
      next();
    } else {
      // request was via http, so redirect to https
      res.redirect(`https://${req.headers.host}${req.url}`);
    }
  });
}

// Setting the root path for views directory
app.set("views", path.join(__dirname, "views"));

// Setting the view engine
app.set("view engine", "ejs");

// Middlewares
app.use(express.static("content"));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: "200mb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public"), { dotfiles: "allow" }));
app.use(serveFavicon(path.join(__dirname, "public", "images", "favicon.png")));
app.use(
  session({ secret: "yonathanadmasu", resave: false, saveUninitialized: false })
);
app.use(flash());
app.use(fileUpload());

// Passport Config
app.use(passport.initialize());
app.use(passport.session());
// passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

// Global variables
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user;
  next();
});

// Routers Config
app.use("/admin", adminRouter);

if (process.env.NODE_ENV == "UNDERCONSTRUCTION") {
  app.get("*", (req: Request, res: Response) =>
    res.render("underconstruction.ejs")
  );
}
app.use("/", indexRouter);
app.use("/home", oldIndexRouter);

// catch 404 and forward to error handler
app.use((req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND);
  res.render("404");
});

// error handler
app.use((err: Error, req: Request, res: Response) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "DEVELOPMENT" ? err : {};

  // render the error page
  res.status(httpStatus.INTERNAL_SERVER_ERROR);
  res.render("error");
});

export default app;
