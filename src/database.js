const mongoose = require("mongoose");
require("dotenv").config(); //load environment variables

const url = process.env.ATLAS_URI;
console.log(url);
const connectDB = async () => {
  try {
    await mongoose.connect(url, {});
    console.log("Database is connected");
  } catch (err) {
    console.error(`Error connecting to the database: ${err}`);
    process.exit(1); //stop the app since the connection failed
  }
};

module.exports = connectDB;
