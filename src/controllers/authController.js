const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const CustomNotFoundError = require("../errors/CustomNotFoundError");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const CustomError = require("../errors/CustomError");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const validateEmail = require("../utils/emailValidator");

//load environment variables
require("dotenv").config();

exports.registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  const existingUser = await User.findOne({
    $or: [
      { name: { $regex: new RegExp(`^${name}$`, "i") } },
      { email: { $regex: new RegExp(`^${email}$`, "i") } },
    ],
  });

  if (existingUser) {
    if (existingUser.name.toLowerCase() === name.toLowerCase()) {
      throw new CustomError("Username already exists", 400);
    }
    if (
      existingUser.email.toLowerCase() === email.toLowerCase() &&
      existingUser.isVerified
    ) {
      throw new CustomError("Email already exists", 400);
    }
  }

  // Move email validation after database check to avoid unnecessary API calls
  if (!existingUser || !existingUser.isVerified) {
    const emailValidationResult = await validateEmail(email);
    console.log(`emailvalidation result: ${emailValidationResult.isValid}`);
    if (!emailValidationResult || !emailValidationResult.isValid) {
      throw new CustomError("Please use a valid email address", 400);
    }
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpires = new Date(Date.now() + 3600000);

  const hash = await bcrypt.hash(password, 8);

  let user;

  if (existingUser && !existingUser.isVerified) {
    existingUser.name = name;
    existingUser.password = hash;
    existingUser.role = role;
    existingUser.verificationToken = verificationToken;
    existingUser.verificationTokenExpires = verificationTokenExpires;
    user = await existingUser.save();
  } else {
    user = await User.create({
      name,
      email,
      password: hash,
      role,
      verificationToken,
      verificationTokenExpires,
    });
  }

  const verificationLink = `${process.env.BASE_URL}/auth/verify-email?token=${verificationToken}`;

  sendEmail({
    to: email,
    subject: "Verify Your Email",
    html: `
      <h3>Welcome to Heart of Paws!</h3>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationLink}" target="_blank">Verify Email</a>
    `,
  }).catch((err) => console.error("Email sending failed:", err));

  res.status(201).send({
    message: user.email,
  });
});

//login controller
exports.loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email, isVerified: true });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new CustomError("Invalid username or password.", 401);
  }

  // Create user session object
  req.session.user = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  // Wrap session save in a promise to handle asynchronous save
  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) {
        reject(new CustomError("Session could not be saved", 500));
      } else {
        resolve();
      }
    });
  });

  res.status(200).send({
    message: "User logged in successfully",
    name: req.session.user.name,
    id: req.session.user.id,
    role: user.role,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  if (!req.session) {
    return res.status(200).send({ message: "No session to logout" });
  }

  req.session.destroy((err) => {
    if (err) {
      throw new CustomError("Failed to logout user, please try again", 500);
    }

    res.status(200).send({ message: "Logout successful." });
  });
});

exports.verifyAuth = asyncHandler(async (req, res) => {
  res.status(200).send({ message: "Authenticated" });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.query;
  console.log(`Received Token: ${token}`);

  if (!token) {
    throw new CustomError("Invalid token", 400);
  }

  const user = await User.findOne({
    verificationToken: token,
  });

  if (!user) {
    throw new CustomError("Invalid or expired token", 400);
  }

  console.log(`Stored Expiry: ${user.verificationTokenExpires}`);
  console.log(`Current Time: ${new Date(Date.now())}`);

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpires = undefined;

  await user.save();

  res.redirect(
    `${process.env.FRONTEND_URL}/verified.html?name=${encodeURIComponent(
      user.name
    )}&email=${encodeURIComponent(user.email)}`
  );
});
