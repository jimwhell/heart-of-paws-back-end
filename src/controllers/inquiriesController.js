const Inquiry = require("../models/inquiry");
const asyncHandler = require("express-async-handler");
const CustomError = require("../errors/CustomError");
const User = require("../models/user");

exports.createInquiry = asyncHandler(async (req, res) => {
  const { name, email, phoneNo, inquiry, subject } = req.body;

  const newInquiry = new Inquiry({
    user: req.session.user.id,
    senderName: name,
    senderEmail: email,
    senderPhoneNo: phoneNo,
    inquiry: inquiry,
    subject: subject,
  });

  const result = await newInquiry.save();

  if (!result) {
    throw new CustomError("Error creating inquiry", 500);
  }

  res.status(201).send({ message: "Inquiry created successfully" });
});

exports.getAllInquiries = asyncHandler(async (req, res) => {
  const allInquiries = await Inquiry.find().sort({ createdAt: -1 });

  if (!allInquiries) {
    throw new CustomError("No inquiries found", 404);
  }

  res.status(200).json(allInquiries);
});

exports.getInquiry = asyncHandler(async (req, res) => {
  const inquiryId = req.params.inquiryId;
  console.log(`inquiry id: ${inquiryId}`);
  const inquiry = await Inquiry.findById(inquiryId);

  if (!inquiry) {
    throw new CustomError("Inquiry not found", 404);
  }

  res.status(200).json(inquiry);
});

exports.deleteInquiry = asyncHandler(async (req, res) => {
  const inquiryId = req.params.inquiryId;

  const result = await Inquiry.findByIdAndDelete(inquiryId);

  if (!result) {
    throw new CustomError("Failed to delete inquiry", 404);
  }

  res.status(204).send();
});
