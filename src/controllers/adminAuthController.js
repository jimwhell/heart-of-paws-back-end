const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const CustomError = require("../errors/CustomError");
const bcrypt = require("bcryptjs");

require("dotenv").config();

exports.loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new CustomError("Invalid username or password.", 401);
  }

  console.log(`user role: ${user.role}`);

  if (user.role !== "admin") {
    throw new CustomError("Access denied.", 401);
  }

  req.session.user = { id: user.id, name: user.name, role: user.role };

  res.status(200).send({
    message: "User logged in successfully",
    name: req.session.user.name,
    id: req.session.user.id,
  }); //set cookie header will be sent along with the response
});

exports.logoutAdmin = asyncHandler(async (req, res) => {
  if (!req.session) {
    return res.status(200).send({ message: "No session to logout" });
  }

  req.session.destroy((err) => {
    if (err) {
      throw new CustomError("Failed to logout user, please try again", 500);
    }

    res.status(200).send({ message: "Admin Logout successful." });
  });
});

exports.verifyAdminAuth = asyncHandler(async (req, res) => {
  res.status(200).send({ message: "Admin Authenticated" });
});
