import request from "request";

const reCaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

export const isBot = async (
  token: string,
  remote: string
): Promise<boolean> => {
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${reCaptchaSecretKey}&response=${token}&remoteip=${remote}`;

  try {
    const httpResponse = await request.post(url);
    let resp;
    if (typeof httpResponse.body === "string") {
      resp = JSON.parse(httpResponse.body);
    } else {
      resp = JSON.parse(httpResponse.body.toString());
    }
    console.log(resp);
    return resp.success === false;
  } catch (err) {
    throw err; // handle error
  }
};
