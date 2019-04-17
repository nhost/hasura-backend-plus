const {
  OTP_STEP,
} = require('../config');

module.exports = {
  generateOTP: function() {
    // console.warn(`2FA Token is (valid for ${OTP_STEP} second): ${otp}`);

    // You can modify this file to send this totp value as SMS, Email, Authentication app or ....
  },
  sendOTP: function(user, otp) {
    console.warn(`2FA Token is (valid for ${OTP_STEP} second): "${otp}" for "${user.username}"`);

    // You can modify this file to send this totp value as SMS, Email, Authentication app or ....
  },
};
