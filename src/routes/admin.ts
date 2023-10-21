import { Router } from "express";
import { AuthMiddleware } from "../config/auth";
import { AdminController } from "../controllers/adminController";
import { UserController } from "../controllers/userController";

const router: Router = Router();

// GET - Private - Go to admin dashboard
router.get(
  "/",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.index_get
);

// GET - Public - Show admin login form
router.get(
  "/login",
  AuthMiddleware.ensureAuthenticatedAdminLogin,
  AdminController.login_get
);

// POST - Public - Login and Redirect to dashboard
router.post("/login", AdminController.login_post);

// GET - Private - Log out admin
router.get(
  "/logout",
  AuthMiddleware.ensureAuthenticatedAdmin,
  UserController.logoutadmin_post
);

// GET - Private - Show Admin Edit Profile Page
router.get(
  "/logout",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editprofile_get
);

// POST - Private - Save Changes to Admin Profile
router.post(
  "/editprofile",
  AuthMiddleware.ensureAuthenticatedAdmin,
  UserController.editprofileadmin_post
);

// GET - Private - Show Admin Change Password Page
router.get(
  "/changepassword",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.changepassword_get
);

// POST - Private - Change Admin Password
router.post(
  "/changepassword",
  AuthMiddleware.ensureAuthenticatedAdmin,
  UserController.changepasswordadmin_post
);

// GET - Private - Show List of Administrators
router.get(
  "/admins",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.admins_get
);

// GET - Private - Show Add Admin Page
router.get(
  "/admins/addadmin",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.addadmin_get
);

// POST - Private - Register a new admin
router.post(
  "/admins/addadmin",
  AuthMiddleware.ensureAuthenticatedAdmin,
  UserController.addadmin_post
);

// POST - Private - Delete a particular admin
router.post(
  "/admins/:id/delete",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deleteuser_post
);

// GET - Private - Show List of Subscribers
router.get(
  "/subscribers",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.subscribers_get
);

// POST - Private - Delete a particular User
router.post(
  "/subscribers/:id/delete",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deletesubscriber_post
);

// GET - Private - Show List of Messages
router.get(
  "/messages",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.messages_get
);

// GET - Private - Delete a message
router.get(
  "/deletemessage/:contactusid",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deletemessage_get
);

// GET - Private - Go to Logs page
router.get(
  "/botslogs",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.botslogs_get
);

// POST - Private - Clear Scrape Log File Data
router.post(
  "/botslogs/clearlogs",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.clearlogs_post
);

// GET - Private - Go to db stats page
router.get(
  "/dbstats",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.dbstats_get
);

// GET - Private - Go to Rulings page
router.get(
  "/rulings",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.rulings_get
);

// GET - Private - Get All Courthouses
router.get(
  "/courthouses",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.courthouses_get
);

// GET - Private - Get All Rulings For a Department
router.get(
  "/departments/rulings/:departmentId",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.departmentrulings_get
);

// GET - Private - Show Edit Courthouse Page for a particular courthouse
router.get(
  "/courthouses/:id/editcourthouse",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editcourthouse_get
);

// GET - Private - Save Changes made to Courthouse
router.post(
  "/courthouses/:id/editcourthouse",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editcourthouse_post
);

// GET - Private - Show Add Courthouse Page
router.get(
  "/courthouses/addcourthouse",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.addcourthouse_get
);

// POST - Private - Add a new Courthouse
router.post(
  "/courthouses/addcourthouse",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.addcourthouse_post
);

// POST - Private - Delete a particular courthouse
router.post(
  "/courthouses/:id/deletecourthouse",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deletecourthouse_post
);

// POST - Private - Delete a particular department
router.post(
  "/departments/:id/delete",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deletedepartment_post
);

// GET - Private - Get All Judges with Rulings
router.get(
  "/judges",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.judges_get
);

// GET - Private - Get All Rulings For a Judge
router.get(
  "/judges/rulings/:judgeid",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.judgerulings_get
);

// GET - Private - Show Add Judge Page
router.get(
  "/judges/addjudge",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.addjudge_get
);

// POST - Private - Save a Judge
router.post(
  "/judges/addjudge",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.addjudge_post
);

// GET - Private - Show Edit Judge Page
router.get(
  "/judges/:id/editjudge",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editjudge_get
);

// POST - Private - Save Changes to a Judge
router.post(
  "/judges/:id/editjudge",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editjudge_post
);

// POST - Private - Delete a particular judge
router.post(
  "/judges/:id/delete",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deletejudge_post
);

// GET - Private - Get Ruling Content for ONE ruling
router.get(
  "/rulings/show/:id",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.ruling_get
);

// @route   GET admin/rulings/addrulings
// @desc    Get Add Rulings Page
// @access  Admin
// router.get('/rulings/addrulings', AuthMiddleware.ensureAuthenticatedAdmin, AdminController.addrulings_get);

// @route   POST admin/rulings/addrulings
// @desc    Add a Ruling to Database
// @access  Admin
// router.post('/rulings/addrulings', AuthMiddleware.ensureAuthenticatedAdmin, AdminController.addrulings_post);

// POST - Private - Delete a particular ruling
router.post(
  "/rulings/:id/delete",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deleteruling_post
);

// GET - Private - Show form for Changing Courthouse and Department of A particular Ruling
router.get(
  "/rulings/:id/edit",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editruling_get
);

// POST - Private - Save Modifications to the ruling
router.post(
  "/rulings/:id/edit",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editruling_post
);

// POST - Private - Set Verify Enable or Disable a ruling
router.post(
  "/rulings/:id/verify/:status",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.verifyruling_post
);

// GET - Private - Show edit FAQ Page
router.get(
  "/pages/faq",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.pagefaq_get
);

// POST - Private - Save Changes Made to FAQs
router.post(
  "/pages/faq",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.pagefaq_post
);

// POST - Private - Delete a FAQ
router.post(
  "/pages/faq/:id/deletefaq",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.pagefaqdelete_post
);

// GET - Private - Show edit Home Page
router.get(
  "/pages/home",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.pagehome_get
);

// POST - Private - Save Changes Made to Home page
router.post(
  "/pages/home",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.pagehome_post
);

// GET - Private - Show Judge Profiles Page
router.get(
  "/pages/judge-profiles",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.judgeprofiles_get
);

// GET - Private - Show Add Judge Profile Page
router.get(
  "/pages/add-judge-profile",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.addjudgeprofile_get
);

// POST - Private - Add Judge Profile
router.post(
  "/pages/add-judge-profile",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.addjudgeprofile_post
);

// GET - Private - Delete a Judge Profile
router.get(
  "/pages/delete-judge-profile/:id",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.deletejudgeprofile_get
);

// GET - Private - Show Edit Judge Profile Page
router.get(
  "/pages/edit-judge-profile/:id",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editjudgeprofile_get
);

// post - Private - Edit Judge Profile
router.post(
  "/pages/edit-judge-profile",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.editjudgeprofile_post
);

// get - Private - Chnage Judge Profile Publish Status
router.get(
  "/pages/publish-judge-profile/:id/:value",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.publishjudgeprofile_get
);

// post - Private - Show Judge Profile Preview
router.post(
  "/pages/judge-profile-preview",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.judgeprofilepreview_post
);

// @route   GET admin/rulings/:id/split
// @desc    Show Split Rulings Page
// @access  Admin
// router.get('/rulings/:id/split', AuthMiddleware.ensureAuthenticatedAdmin, AdminController.splitrulings_get);

// @route   POST admin/rulings/:id/split
// @desc    Save Splitted rulings
// @access  Admin
// router.post('/rulings/:id/split', AuthMiddleware.ensureAuthenticatedAdmin, AdminController.splitrulings_post);

// GET - Private - Add a new department
router.get(
  "/departments/adddepartment",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.adddepartment_get
);

// POST - Private - Add a new department
router.post(
  "/departments/adddepartment",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.adddepartment_post
);

// POST - Private - Change Allow Copy Setting of a user
router.post(
  "/users/:id/allowcopy/:value",
  AuthMiddleware.ensureAuthenticatedAdmin,
  AdminController.changeallowcopy_post
);

export const adminRouter = router;
