const Application = require("../models/application");
const asyncHandler = require("express-async-handler");
const CustomError = require("../errors/CustomError");
const Rescue = require("../models/rescue");
const moment = require("moment");

const VALID_TIME_SLOTS = ["11:00 AM - 1:00 PM", "3:00 PM - 5:00 PM"];

exports.getAllApplications = asyncHandler(async (req, res) => {
  const { status } = req.query;
  console.log(req.query);

  let query = {};

  if (status) {
    query.status = status;
  }

  const allApplications = await Application.find({ ...query })
    .sort({ createdAt: -1 })
    .populate("rescue", "name")
    .populate("user", "name profileImage");

  if (!allApplications) {
    throw new CustomError("No applications found", 404);
  }

  res.status(200).json(allApplications);
});

exports.searchApplications = asyncHandler(async (req, res) => {
  let payload = req.body.payload;

  let search = await Application.find({
    applicantName: { $regex: new RegExp("^" + payload + ".*", "i") },
  }).exec();

  search = search.slice(0, 10); //limit the results to 10

  res.status(200).send({ payload: search });
});

//get applications for rescue
exports.getApplicationsForRescue = asyncHandler(async (req, res) => {
  const rescueSlug = req.params.slug;

  const rescue = await Rescue.findOne({ slug: rescueSlug });

  if (!rescue) {
    throw new CustomError("Rescue not found.", 404);
  }

  const allRescueApplications = await Application.find({
    rescue: rescue._id,
  })
    .sort({ interviewDate: 1 })
    .populate("user", "profileImage")
    .exec();

  res.status(200).json(allRescueApplications);
});

//get user by application
exports.getUserByApplication = asyncHandler(async (req, res) => {
  const applicationId = req.params.applicationId;

  const user = await Application.findById(applicationId)
    .populate("user")
    .populate("rescue", "name")
    .exec();

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  res.status(200).json(user);
});

exports.getApplicationsByStatus = asyncHandler(async (req, res) => {});

// Create application
exports.createApplication = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;
  const rescue = await Rescue.findOne({ slug: req.params.slug });

  if (!rescue) throw new CustomError("Rescue not found", 404);

  const { interviewDate, interviewTime, ...formData } = req.body;

  // Validate date and time
  if (!moment(interviewDate).isSame(new Date(), "month")) {
    throw new CustomError("Date must be within the current month", 400);
  }

  if (!VALID_TIME_SLOTS.includes(interviewTime)) {
    throw new CustomError("Invalid time slot", 400);
  }

  // ✅ Check for existing booking at the same date and time (across ALL rescues and users)
  const existingSchedule = await Application.findOne({
    interviewDate,
    interviewTime,
  });

  if (existingSchedule) {
    throw new CustomError(
      "This time slot is already booked by another application",
      400
    );
  }

  const duplicateApplication = await Application.findOne({
    user: userId,
    rescue: rescue._id,
  });

  if (duplicateApplication) {
    throw new CustomError(`You have already applied for ${rescue.name}.`, 400);
  }

  // Create and save application
  const application = new Application({
    ...formData,
    user: userId,
    rescue: rescue._id,
    interviewDate,
    interviewTime,
  });

  await application.save();
  res.status(201).json({ message: "Application created successfully" });
});

// Get available dates and slots for current month
exports.getAvailableDates = asyncHandler(async (req, res) => {
  const validTimeSlots = ["11:00 AM - 1:00 PM", "3:00 PM - 5:00 PM"];

  // Get all booked slots for the current month (across all rescues)
  const bookedSlots = await Application.find({
    interviewDate: {
      $gte: moment().startOf("day").toDate(), // Start from today at 00:00
      $lte: moment().endOf("month").toDate(), // End of the month
    },
  });

  // Build a map of booked dates and time slots
  const bookedDates = {};
  bookedSlots.forEach((slot) => {
    const date = moment(slot.interviewDate).format("YYYY-MM-DD");
    if (!bookedDates[date]) {
      bookedDates[date] = [];
    }
    bookedDates[date].push(slot.interviewTime);
  });

  // Generate available slots starting from today
  const availableDates = [];
  const startDate = moment(); // Start from today
  const endDate = moment().endOf("month"); // End of the month

  for (let day = startDate; day.isBefore(endDate); day.add(1, "day")) {
    const date = day.format("YYYY-MM-DD");
    const availableSlots = validTimeSlots.filter(
      (slot) => !(bookedDates[date] || []).includes(slot)
    );

    if (availableSlots.length > 0) {
      availableDates.push({
        date,
        availableSlots,
      });
    }
  }
  res.status(200).json({ availableDates });
});

// Delete application
exports.deleteApplication = asyncHandler(async (req, res) => {
  const applicationId = req.params.id;
  const userId = req.session.user.id;

  const application = await Application.findById(applicationId);
  if (!application) {
    throw new CustomError("Application not found", 404);
  }

  if (application.user.toString() !== userId.toString()) {
    throw new CustomError("Unauthorized request to delete application", 401);
  }

  const result = await Application.deleteOne({ _id: applicationId });

  if (!result) {
    throw new CustomError("Error in deleting application", 500);
  }

  res.status(204).send();
});
