const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const applicationSchema = new Schema(
  {
    applicantName: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rescue: {
      type: Schema.Types.ObjectId,
      ref: "Rescue",
      required: true,
    },
    phoneNo: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    sex: {
      type: String,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    civilStatus: {
      type: String,
      enum: ["single", "married", "divorced", "widowed"],
      required: true,
      trim: true,
    },
    occupation: {
      type: String,
      default: "Unemployed",
      trim: true,
      maxlength: 100,
    },
    appointmentMode: {
      type: String,
      required: true,
      enum: ["online", "in-person"],
    },
    introductionMessage: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    interviewDate: {
      type: Date,
      required: true,
    },
    interviewTime: {
      type: String,
      required: true,
      enum: ["11:00 AM - 1:00 PM", "3:00 PM - 5:00 PM"],
    },
    status: {
      type: String,
      required: true,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
