const crypto = require('crypto');
const totp = require('otplib/totp');

const {
  OTP_STEP,
  OTP_SECRET_SALT,
} = require('../config');

totp.options = {
  crypto: crypto,
  step: OTP_STEP
};

module.exports = {
  generateOTP: function(username) {
    const secret = username + OTP_SECRET_SALT;
    return totp.generate(secret);
  },

  checkOTP: function(username, otp) {
    const secret = username + OTP_SECRET_SALT;
    return totp.check(otp, secret);
  },

  // TODO: You must modify this function to send this OTP value through SMS, Email, Authentication app or anyway you want.
  sendOTP: function(user, otp) {
    console.warn(`2FA Token is (valid for ${OTP_STEP} second): "${otp}" for "${user.username}"`);
  },
};
