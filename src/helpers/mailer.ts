import nodemailer, { TestAccount } from "nodemailer";
import { appConfig } from "../config/keys";

const sendVerificationMail = async (
  userEmail: string,
  verificationToken: string
) => {
  try {
    const emailBody = "";
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: appConfig.contactRulingsLaw.host,
      port: appConfig.contactRulingsLaw.port,
      secure: appConfig.contactRulingsLaw.secure,
      auth: {
        user: appConfig.contactRulingsLaw.user,
        pass: appConfig.contactRulingsLaw.password,
      },
    });

    const mailOptions = {
      from: "rulings.law <contact@rulings.law>",
      to: userEmail,
      subject: "Verify your email address",
      html: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification Email Sent : %s", info.response);
  } catch (error) {
    console.error(error);
  }
};

const sendResetPasswordMail = async (
  userEmail: string,
  verificationToken: string
) => {
  try {
    const emailBody = "";
    const account = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: appConfig.contactRulingsLaw.host,
      port: appConfig.contactRulingsLaw.port,
      secure: appConfig.contactRulingsLaw.secure,
      auth: {
        user: appConfig.contactRulingsLaw.user,
        pass: appConfig.contactRulingsLaw.password,
      },
    });

    const mailOptions = {
      from: "rulings.law <contact@rulings.law>",
      to: userEmail,
      subject: "Reset your password",
      html: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Reset Password Email Sent : %s", info.response);
  } catch (error) {
    console.log(error);
  }
};

export const Mailer = { sendVerificationMail, sendResetPasswordMail };
