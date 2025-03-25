const asyncHandler = require("express-async-handler");
const CustomError = require("../errors/CustomError");
const Application = require("../models/application");
const Rescue = require("../models/rescue");
const Inquiry = require("../models/inquiry");
const sendEmail = require("../utils/sendEmail");

exports.approveOrRejectApplication = asyncHandler(async (req, res) => {
  const applicationId = req.params.applicationId;
  console.log(`application id: ${applicationId}`);
  const status = req.body.status;
  console.log(`status: ${status}`);

  if (!["approved", "rejected"].includes(status)) {
    throw new CustomError("Invalid status", 400);
  }

  const application = await Application.findById(applicationId)
    .populate("user", "email")
    .populate("rescue", "name");

  if (!application) {
    console.log(`Application not found: ${application}`);
    throw new CustomError("Application not found", 404);
  }

  const userEmail = application.user.email;
  const rescueName = application.rescue.name;
  const applicantName = application.applicantName;
  const subject = "Adoption Request Result";

  application.status = status;
  await application.save();

  let message = "";

  if (status === "approved") {
    const rescue = await Rescue.findById(application.rescue);

    if (!rescue) {
      throw new CustomError("Rescue not found", 404);
    }

    rescue.availability = "adopted";
    await rescue.save();

    message = `
      <h2>Adoption Confirmation</h2>
      <p>Dear ${applicantName},</p>
      <p>We are excited to inform you that your adoption application for <strong>${rescueName}</strong> has been approved!</p>
      <p>On behalf of everyone at Heart of Paws, congratulations on your new journey with <strong>${rescueName}</strong>! 🐾</p>
      <p>We'll be in touch soon with more details about the adoption process and next steps. In the meantime, if you have any questions or need more information, don't hesitate to reach out to us at <strong>heartofpawstarlac@gmail.com</strong>.</p>
      <p>Thank you for choosing adoption and giving <strong>${rescueName}</strong> a loving forever home!</p>
      <p>Best regards,</p>
      <p><strong>The Heart of Paws Team</strong></p>
      <p><em>Heart of Paws - Giving animals a second chance at love.</em></p>
    `;
  } else if (status === "rejected") {
    message = `
      <h2>Adoption Application Update</h2>
      <p>Dear ${applicantName},</p>
      <p>Thank you for your interest in adopting <strong>${rescueName}</strong>. After careful consideration, we regret to inform you that we are unable to move forward with your adoption application at this time.</p>
      <p>While we understand this news may be disappointing, please know that we truly appreciate your desire to provide a loving home for an animal in need. We encourage you to keep an eye on future adoption opportunities and apply again when a suitable match becomes available.</p>
      <p>If you have any questions or would like more information, feel free to reach out to us at <strong>heartofpawstarlac@gmail.com</strong>.</p>
      <p>Thank you once again for your compassion and support of Heart of Paws.</p>
      <p>Best regards,</p>
      <p><strong>The Heart of Paws Team</strong></p>
      <p><em>Heart of Paws - Giving animals a second chance at love.</em></p>
    `;
  }

  // Send the email
  sendEmail({
    to: userEmail,
    subject: `Re: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4CAF50; text-align: center;">Heart of Paws - ${subject}</h2>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <p style="margin: 0;"><strong style="color: #333;">Applicant:</strong> ${applicantName}</p>
          <p style="margin: 0;"><strong style="color: #333;">Rescue:</strong> ${rescueName}</p>
        </div>
        <div style="background: #eef7ea; padding: 15px; border-left: 4px solid #4CAF50; border-radius: 5px;">
          <p style="margin: 0;"><strong style="color: #333;"></strong> ${message}</p>
        </div>
        <p style="text-align: center; margin-top: 20px; color: #555;">
          Thank you for reaching out to us! <br> 
          <strong>Heart of Paws Team</strong>
        </p>
      </div>
    `,
  }).catch((err) => console.error("Email sending failed:", err));

  res
    .status(200)
    .json({ message: `Application ${status}`, application: application });
});

exports.respondToInquiry = asyncHandler(async (req, res) => {
  const inquiryId = req.params.inquiryId;
  console.log(req.message);

  const { message } = req.body;

  console.log(`inquiry id: ${inquiryId}`);
  console.log(`message: ${message}`);

  const inquiry = await Inquiry.findById(inquiryId);

  if (!inquiry) {
    throw new CustomError("Inquiry not found!", 404);
  }

  const response = {
    message,
    timestap: new Date(),
  };

  if (!inquiry.responses) {
    inquiry.responses = [];
  }

  inquiry.responses.push(response);
  await inquiry.save();

  if (!inquiry) {
    throw new CustomError("Error in saving inquiry", 500);
  }

  sendEmail({
    to: inquiry.senderEmail, // Using the sender's email from the inquiry
    subject: `Re: ${inquiry.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; ">
        <h2 style="color: #1c959d; text-align: center; margin-bottom: 10px;">Heart of Paws -  ${inquiry.subject}</h2>
       
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <p style="margin: 0;"><strong style="color: #333;">Inquiry:</strong> ${inquiry.inquiry}</p>
        </div>
        <div style="background: #eef7ea; padding: 15px; border-left: 4px solid #4CAF50; border-radius: 5px;">
          <p style="margin: 0;"><strong style="color: #333;"></strong> ${message}</p>
        </div>
        <p style="text-align: center; margin-top: 20px; color: #555;">
          Thank you for reaching out to us! <br> 
          <strong>Heart of Paws Team</strong>
        </p>
      </div>
    `,
  }).catch((err) => console.error("Email sending failed:", err));

  res.status(200).json(inquiry);
});
