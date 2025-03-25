const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "user"],
    },
    profileImage: {
      type: String,
      required: true,
      default:
        "https://res.cloudinary.com/dydm43ec5/image/upload/v1742289560/profileImages/le0xekv9hluoehypgmsf.png",
    },
    verificationToken: { type: String },
    verificationTokenExpires: { type: Date }, // ✅ Add this line
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (this.name) {
    this.name = this.name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
