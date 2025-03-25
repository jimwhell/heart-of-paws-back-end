const Application = require("../models/application");
const asyncHandler = require("express-async-handler");
const CustomError = require("../errors/CustomError");
const Rescue = require("../models/rescue");
const User = require("../models/user");
const cloudinary = require("../utils/cloudinary");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//multer middleware for a single profile image, used in the uploadProfileImage route
exports.uploadProfileImage = upload.single("profileImage");

exports.getUsers = asyncHandler(async (req, res) => {
  let payload = req.body.payload;

  let search = await User.find({
    name: { $regex: new RegExp("^" + payload + ".*", "i") },
  }).exec();

  search = search.slice(0, 10); //limit the results to 10

  res.status(200).send({ payload: search });
});

//get user along with applications
exports.getUserWithApplications = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  console.log(`userid: ${userId}`);

  const applications = await Application.find({ user: userId })
    .populate("rescue", "name featureImage")
    .sort({ interviewDate: 1 });

  if (!applications) {
    throw new CustomError("Applications not found", 404);
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  res.status(200).send({ user, applications });
});

//get all users along with their application counts
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.aggregate([
    {
      $match: { role: "user" },
    }, //match only documents matching the role of user
    {
      $lookup: {
        from: "applications", //collection to join with
        localField: "_id", //field from user document (input document)
        foreignField: "user", //field from the documents applications
        as: "applications", //specifies the name of the new array field to add to the input documents
      },
    },
    {
      $project: {
        _id: 1,
        name: 1, //fields for the keeping
        email: 1,
        profileImage: 1,
        createdAt: 1,
        applicationsCount: { $size: "$applications" }, //Counts and returns the total number of items in an array
      },
    },
  ]);

  if (!users) {
    throw new CustomError("No users found!", 404);
  }

  res.status(200).json(users);
});

//get user profile
exports.getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  console.log(`user id: ${userId}`);

  const status = req.query.status; //if client specifies a query/filter for application status
  console.log(`status: ${status}`);
  let query = {};

  if (status) {
    query.status = status;
  }

  const user = await User.findById(userId).select("-password");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Get all applications for user
  const userApplications = await Application.find({ user: userId, ...query })
    .populate("rescue", "name slug featureImage")
    .exec();

  const enhancedApplications = await Promise.all(
    userApplications.map(async (application) => {
      // For each application, find all applications for the same rescue
      // that are still pending and sort them by creation date
      const queueApplications = await Application.find({
        rescue: application.rescue._id,
        status: "pending",
      })
        .sort({ createdAt: 1 }) // Sort by creation date, oldest first
        .exec();

      // Find the position of the current application in the queue
      const position =
        queueApplications.findIndex(
          (app) => app._id.toString() === application._id.toString()
        ) + 1; // Add 1 because array indices start at 0

      // Get total number of applicants for this rescue
      const totalApplicants = queueApplications.length;

      // Convert the application to a plain object so we can add properties
      const appObject = application.toObject();

      // Add queue information
      appObject.queuePosition = position;
      appObject.totalApplicants = totalApplicants;

      return appObject;
    })
  );

  res.status(200).json({
    user,
    applications: enhancedApplications,
  });
});

//update user profile image
exports.updateProfileImage = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  if (!req.file) {
    throw new CustomError("No profile image uploaded!", 400);
  }
  console.log("File received:", req.file);

  const user = await User.findById(userId);
  console.log(`user: ${user}`);

  if (!user) {
    throw new CustomError("User not found!", 404);
  }

  // Store the previous profile image URL
  const previousImageUrl = user.profileImage;

  // Function to upload to cloudinary that returns a promise of error or the url of the image
  const uploadToCloudinary = () => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: "profileImages",
            transformation: [
              { width: 800, height: 600, crop: "limit" },
              { fetch_format: "webp", quality: "auto" },
            ],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        )
        .end(req.file.buffer);
    });
  };

  // Upload new image to Cloudinary
  const profileImageUrl = await uploadToCloudinary();
  console.log(`New profile image URL: ${profileImageUrl}`);

  if (!profileImageUrl) {
    throw new CustomError("Error uploading user profile image", 500);
  }

  // Set found user's profile image field to the new URL
  user.profileImage = profileImageUrl;
  await user.save();

  // Delete the previous image from Cloudinary if it exists
  if (
    previousImageUrl !==
    "https://res.cloudinary.com/dydm43ec5/image/upload/v1742289560/profileImages/le0xekv9hluoehypgmsf.png"
  ) {
    try {
      // Extract the public ID from the Cloudinary URL
      const urlParts = previousImageUrl.split("/");
      const filenamePart = urlParts[urlParts.length - 1];
      const folderPart = urlParts[urlParts.length - 2];
      const publicId = `${folderPart}/${filenamePart.split(".")[0]}`;

      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error(`Error deleting previous image: ${error}`);
            resolve(); // Continue even if deletion fails
          } else {
            console.log(`Previous image deleted: ${result}`);
            resolve(result);
          }
        });
      });
    } catch (error) {
      console.error(`Error in deletion process: ${error}`);
      // We continue even if deletion fails
    }
  }

  res.status(200).send({
    message: "User profile image successfully updated",
    profileImage: profileImageUrl,
  });
});
