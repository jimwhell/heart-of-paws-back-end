const axios = require("axios");
require("dotenv").config();

const validateEmail = async function (email) {
  console.log(`[Email Validation] Starting validation for: ${email}`);

  try {
    const response = await axios.get("https://api-bdc.net/data/email-verify", {
      params: {
        emailAddress: email,
        key: process.env.BIGDATACLOUD_API_KEY,
      },
    });

    console.log(
      `[Email Validation] Response received for ${email}:`,
      response.data
    );
    console.log(`[Email Validation] isValid value: ${response.data.isValid}`);

    return response.data;
  } catch (error) {
    console.error(`[Email Validation] Error for ${email}:`, error.message);
    return { isValid: false };
  }
};

module.exports = validateEmail;
