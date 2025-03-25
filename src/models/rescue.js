const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const slugify = require("slugify");

const rescueSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  slug: {
    type: String,
    unique: true,
  },
  sex: {
    type: String,
    required: true,
  },
  age: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
    required: true,
    enum: ["available", "adopted"],
    default: "available",
  },
  size: {
    type: String,
    required: true,
    enum: ["small", "medium", "large"],
  },
  vetStatus: {
    type: [String],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  featureImage: {
    type: String,
    required: true,
  },
  galleryImages: {
    type: [String],
    required: true,
  },
});

/* Pre-save middleware to generate the slug (for creation). runs before the document is saved to the database. checks for a save event, then generates a slug based on the document's name*/
rescueSchema.pre("save", function (next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  console.log("slug generated!");
  next();
  /*called to signal to Mongoose that the pre-save operation is complete, and it should continue with the save operation.*/
});

const Rescue = mongoose.model("Rescue", rescueSchema);

module.exports = Rescue;
