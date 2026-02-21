import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatuses, TaskStatusEnum } from "../utils/constants.js";

const taskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: String, // instead of opening up {} and indicating 'type', you can just set type like this
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId, // what is this object id? is it the _id property?
      ref: "User",
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: AvailableTaskStatuses,
      default: TaskStatusEnum.TODO,
    },
    attachments: {
      type: [
        {
          url: String,
          mimetype: String, // can be pdf or images..? does it store the file TYPE like the .pdf extension or the actual content itself? i know mimetype is like text/html etc. is it storing the contents or the actual 'text/html'
          size: Number,
        },
      ], // the type is an array which contains objects? im guessing each object is 1 attachment?
      default: [],
    },
  },
  { timestamps: true },
);

export const Tasks = mongoose.model("Task", taskSchema);
