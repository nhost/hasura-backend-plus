import fetch from "node-fetch"

require("dotenv").config()

export const gcaptchaVerify = async (token: string, ip: string) => {
  let passCaptcha = false

  if (token) {
    const verificationUrl =
      "https://www.google.com/recaptcha/api/siteverify?secret=" +
      process.env.GOOGLE_RECAPTCHA_SECRET_KEY +
      "&response=" +
      token +
      "&remoteip=" +
      ip

    const response = await fetch(verificationUrl)
    const captchaValidation = await response.json()
    passCaptcha = captchaValidation.success
  }

  return passCaptcha
}
