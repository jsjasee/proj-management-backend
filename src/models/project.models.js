import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    createdBy: {
      type: Schema.Types.ObjectId, // this means you will refer to another document (aka the user document created from the User schema)
      ref: "User", // this name is whatever you keyed in when creating the mongoose model: 'export const User = mongoose.model("User", userSchema);'
      required: true,
    },
  },
  { timestamps: true },
); // timestamps true will make the fields createdAt and updatedAt available

export const Project = mongoose.model("Project", projectSchema); // mongoose will convert "Project" into "projects" (lowercase plural form)
