require('dotenv').config()

export const hcaptchaVerify = async (token: string) => {

  let passCaptcha = false

  if (token) {
    const response = await fetch(`https://hcaptcha.com/siteverify`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
      },
      body: `response=${token}&secret=${process.env.HCAPTCHA_SECRET_KEY}`,
      method: 'POST'
    })
    const captchaValidation = await response.json()
    passCaptcha = captchaValidation.success
  }

  return passCaptcha
}
