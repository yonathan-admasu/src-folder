import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Mailer } from "../helpers/mailer";
import User, { IUser } from "../models/user";
import moment from "moment-timezone";

type Error = {
  msg: string;
};

// GET Display Login Page
const login_get = (req: Request, res: Response) => {
  res.render("welcome/login");
};

// GET Display Register Page
const register_get = (req: Request, res: Response) => {
  res.render("welcome/register");
};

// POST Authenticate User
const login_post = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/users/login",
    failureFlash:
      "We do not recognize your email address as being associated with an account. Please sign up to access the rulings.law database.",
  })(req, res, next);
};

// POST Log user Out
const logout_post = (req: Request, res: Response) => {
  req.logout(() => console.log("---logout---"));
  req.flash("success_msg", "You are logged out");
  res.redirect("/users/login");
};

// POST Log user Out
const logoutadmin_post = (req: Request, res: Response) => {
  req.logout(() => console.log("---logout---"));
  req.flash("success_msg", "You are logged out");
  res.redirect("/admin/login");
};

// POST Register User
const register_post = async (req: Request, res: Response) => {
  // const fname = req.body.fname.trim();
  // const lname = req.body.lname.trim();
  // const email = req.body.email.trim();
  // const password = req.body.password.trim();
  // const password2 = req.body.password2.trim();
  // const verifytoken = "";
  // const errors: Error[] = [];
  // if (
  //   fname === "" ||
  //   lname === "" ||
  //   email === "" ||
  //   password === "" ||
  //   password2 === ""
  // ) {
  //   errors.push({ msg: "Please enter all fields" });
  // }
  // if (password !== password2) {
  //   errors.push({ msg: "Passwords do not match" });
  // }
  // if (password.length < 6) {
  //   errors.push({ msg: "Password must be at least 6 characters" });
  // }
  // if (errors.length > 0)
  //   res.render("welcome/register", {
  //     errors,
  //     fname,
  //     lname,
  //     email,
  //     password,
  //     password2,
  //   });
  // else {
  //   const user: IUser | null = await User.findOne({ email });
  //   if (user) {
  //     errors.push({ msg: "Email already exists" });
  //     res.render("welcome/register", {
  //       errors,
  //       fname,
  //       lname,
  //       email,
  //       password,
  //       password2,
  //     });
  //   } else {
  //     const newUser: IUser = new User({
  //       firstName: fname,
  //       lastName: lname,
  //       email,
  //       verifytoken,
  //     });
  //     User.register(newUser, password, (err, user) => {
  //       if (err) {
  //         console.log(err);
  //       } else {
  //         Mailer.sendVerificationMail(user.email, user.verification);
  //         req.flash(
  //           "success_msg",
  //           "Almost there! Check your inbox for email verification link"
  //         );
  //         res.redirect("/users/login");
  //       }
  //     });
  //   }
  // }
};

// POST Register Admin
const addadmin_post = async (req: Request, res: Response) => {
  const { fname, lname, email, password, password2 } = req.body;
  const verifytoken = "";
  const errors: Error[] = [];

  if (
    fname.trim() === "" ||
    lname.trim() === "" ||
    email.trim() === "" ||
    password.trim() === "" ||
    password2.trim() === ""
  ) {
    errors.push({ msg: "Please enter all fields" });
  }

  if (password !== password2) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters" });
  }

  if (errors.length > 0)
    res.render("admin/users/addadmin", {
      errors,
      fname,
      lname,
      email,
      password,
      password2,
    });
  else {
    try {
      const user: IUser | null = await User.findOne({ email });
      if (user) {
        errors.push({ msg: "Email already exists" });
        res.render("admin/users/addadmin", {
          errors,
          fname,
          lname,
          email,
          password,
          password2,
        });
      } else {
        const newUser = new User({
          firstName: fname,
          lastName: lname,
          email,
          isAdmin: true,
          allowCopy: true,
        });

        // await User.register(newUser, password);
        req.flash("success_msg", "New Admin Account Created");
        res.redirect("/admin/admins");
      }
    } catch (error) {
      console.log(error);
    }
  }
};

// POST Save changes to user profile
const editprofile_get = async (req: Request, res: Response) => {
  const { fname, lname } = req.body;
  const errors: Error[] = [];

  if (fname.trim() === "" || lname === "") {
    errors.push({ msg: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.render("home/editprofile", { errors });
  } else {
    try {
      const user: IUser | null = await User.findOneAndUpdate(
        { email: "" },
        { firstname: fname, lastname: lname }
      );
      if (user) {
        res.redirect("/home");
      }
    } catch (error) {
      console.log(error);
    }
  }
};

// POST Save changes to admin profile
const editprofileadmin_post = async (req: Request, res: Response) => {
  const { fname, lname } = req.body;
  const errors: Error[] = [];

  if (fname.trim() === "" || lname.trim() === "") {
    errors.push({ msg: "Please enter all fields" });
  } else {
    try {
      const user: IUser | null = await User.findOneAndUpdate(
        { email: "" },
        { firstname: fname, lastname: lname }
      );
      if (user) {
        res.redirect("/home");
      }
    } catch (error) {
      console.log(error);
    }
  }
};

const changepassword_post = async (req: Request, res: Response) => {
  const { currentpassword, password, password2 } = req.body;
  const errors: Error[] = [];

  if (
    currentpassword.trim() === "" ||
    password.trim() === "" ||
    password2.trim() === ""
  )
    errors.push({ msg: "Please enter all fields" });
  if (password === password2) errors.push({ msg: "Passwords do not match" });
  if (password.length < 6 || password2.length < 6)
    errors.push({ msg: "Password must be at least 6 characters" });
  if (currentpassword === password)
    errors.push({ msg: "Please type a new password" });

  if (errors.length > 0) res.render("home/changepassword", { errors });
  else {
    try {
      const user: IUser | null = await User.findOne({ email: req.body.email });
      if (user) {
        // await user.changePassword(currentpassword, password);
        req.flash("success_msg", "Password changed successfully");
        res.redirect("/home/changepassword");
      }
    } catch (error) {
      errors.push({ msg: "Current password is incorrect" });
      res.render("home/changepassword", { errors });
      res.send(error);
    }
  }
};

const changepasswordadmin_post = async (req: Request, res: Response) => {
  const { currentpassword, password, password2 } = req.body;
  const errors: Error[] = [];

  if (
    currentpassword.trim() === "" ||
    password.trim() === "" ||
    password2.trim() === ""
  )
    errors.push({ msg: "Please enter all fields" });
  if (password === password2) errors.push({ msg: "Passwords do not match" });
  if (password.length < 6 || password2.length < 6)
    errors.push({ msg: "Password must be at least 6 characters" });
  if (currentpassword === password)
    errors.push({ msg: "Please type a new password" });

  if (errors.length > 0) res.render("admin/changepassword", { errors });
  else {
    try {
      const user: IUser | null = await User.findOne({ email: req.body.email });
      if (user) {
        // await user.changePassword(currentpassword, password);
        req.flash("success_msg", "Password changed successfully");
        res.redirect("/admin");
      }
    } catch (error) {
      errors.push({ msg: "Current password is incorrect" });
      res.render("admin/changepassword", { errors });
      res.send(error);
    }
  }
};

// Verify User by token
const verifyuser_get = async (req: Request, res: Response) => {
  await User.findOneAndUpdate(
    { verifytoken: req.params.token },
    { isverified: true }
  );
  req.flash("success_msg", "Email verified, you can now login to rulings.law");
  res.redirect("/users/login");
};

// GET Display Forgot Password Page
const forgotpassword_get = async (req: Request, res: Response) => {
  res.render("welcome/forgotpassword");
};

// POST Forgot Password Page
const forgotpassword_post = async (req: Request, res: Response) => {
  const { email } = req.body;
  const errors: Error[] = [];

  if (email.trim() === "") errors.push({ msg: "Enter an email" });
  if (errors.length > 0) res.render("welcome/forgotpassword", { errors });
  else {
    const user: IUser | null = await User.findOne({ email });
    if (user) {
      const resettoken = "";
      // user.resettimestamp = moment().add(1, "hour");
      Mailer.sendResetPasswordMail(user.email, resettoken);
      // user.save();
      req.flash(
        "success_msg",
        "Check your email inbox for reset password link"
      );
      res.redirect("/users/login");
    } else {
      req.flash(
        "error_msg",
        "The email you entered is not registered on rulings.law"
      );
      res.redirect("/users/forgotpassword");
    }
  }
};

// Show Reset Password Form
const resetpassword_get = async (req: Request, res: Response) => {
  const user: IUser | null = await User.findOne({
    resettoken: req.params.token,
  });
  if (user) {
    const now = moment().toDate();
  } else {
    req.flash("error_msg", "Invalid token, please enter your email again");
    res.redirect("/users/forgotpassword");
  }
};

// Reset Password
const resetpassword_post = async (req: Request, res: Response) => {
  const user: IUser | null = await User.findOne({
    resettoken: req.params.token,
  });
  const { password1, password2, token } = req.body;
  const errors: Error[] = [];

  if (password1.trim() === "" || password2.trim() === "")
    errors.push({ msg: "Please enter all fields" });

  if (password1.trim() !== password2.trim()) {
    errors.push({ msg: "Passwords do not match" });
  }

  if (password1.trim().length < 6)
    errors.push({ msg: "Password must be at least 6 characters" });

  if (errors.length > 0) res.render("welcome/resetpassword", { token, errors });
  else {
    const foundUser: IUser | null = await User.findOne({ resettoken: token });
    // foundUser?.setPassword(password1, () => {
    //   foundUser.save();
    //   req.flash(
    //     "success_mg",
    //     "Password changed, you can now login with the new password"
    //   );
    //   res.redirect("/users/login");
    // });
  }
};

export const UserController = {
  login_get,
  register_get,
  login_post,
  logout_post,
  logoutadmin_post,
  register_post,
  addadmin_post,
  editprofile_get,
  editprofileadmin_post,
  changepassword_post,
  changepasswordadmin_post,
  verifyuser_get,
  forgotpassword_get,
  forgotpassword_post,
  resetpassword_get,
  resetpassword_post,
};
