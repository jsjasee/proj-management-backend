import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Tasks } from "../models/task.models.js";
import { Subtask } from "../models/subtask.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableTaskStatuses } from "../utils/constants.js";

const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const tasks = await Tasks.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("assignedTo", "avatar username fullName"); // THIS IS AN ALTERNATIVE FROM AGGREGATION PIPELINE. you can also GRAB more fields from the document so it's like from that extracted task document after you perform .find(), go into the "assignedTo" to get the referred user document and get the 'avatar', 'username', 'fullName' fields. separate them BY spaces not commas and all in between quotation marks. also if find() extracts multiple documents, all documents will have populate performed on each of them.
  // if u need to get info from another field, just use .populate() again after the first .populate()

  return res
    .status(201)
    .json(new ApiResponse(201, tasks, "Task fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, status } = req.body;
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const files = req.files || []; // either we have the attachements or we have an empty array

  const attachments = files.map((file) => {
    return {
      url: `${process.env.SERVER_URL}/images/${file.filename}`, // we are capturing the files from the images folders aka the destination.
      // on multer middlewares code file, we have configured filename to be a format we like, so instead of pointing it to the original filename aka file.originalname, point it to file.filename (look at multer middelwares file if confused.)
      mimetype: file.mimetype,
      size: file.size,
    };
  });

  const task = await Tasks.create({
    title,
    description,
    project: new mongoose.Types.ObjectId(projectId),
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    // the assignedTo field just means if assignedTo is not empty, then convert it to a proper mongoose obj if not just leave that field as undefined
    status,
    assignedBy: new mongoose.Types.ObjectId(req.user._id),
    attachments,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created successfully."));
});

const getTaskById = asyncHandler(async (req, res) => {
  // this typically fires when they CLICK on something in the frontend
  // this will also fetch ALL the subtasks & assignedTo of that main task (we use an aggregation pipeline instead of populate since many fields to fetch.)
  const { taskId, projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  const task = await Tasks.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(taskId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "assignedTo",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subtasks",
        localField: "_id",
        foreignField: "task",
        as: "subtasks",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "createdBy",
              foreignField: "_id",
              as: "createdBy",
              pipeline: [
                {
                  $project: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              createdBy: {
                $arrayElemAt: ["$createdBy", 0],
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        assignedTo: {
          $arrayElemAt: ["$assignedTo", 0],
        },
      },
    },
  ]);

  if (!task || task.length === 0) {
    throw new ApiError(404, "Task not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task[0], "Task fetched successfully")); // the way we have written the pipeline, the first item, task[0], will contain EVERYTHING
});

const updateTask = asyncHandler(async (req, res) => {
  const { taskId, projectId } = req.params; // url part
  const { title, description, status } = req.body; // the body section

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!AvailableTaskStatuses.includes(status)) {
    throw new ApiError(404, "Task status indicated is not valid.");
  }

  const task = await Tasks.findByIdAndUpdate(
    taskId,
    {
      title,
      description,
      status,
    },
    { new: true },
  );

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task updated successfully."));
});

const deleteTask = asyncHandler(async (req, res) => {
  let additionalMessage = "";

  const { taskId, projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const task = await Tasks.findByIdAndDelete(taskId);

  if (!task) {
    throw new ApiError(404, "Task not found.");
  }

  // delete the subtasks as well
  const subtasks = await Subtask.deleteMany({ task: taskId });

  if (!subtasks) {
    additionalMessage = "No subtasks in this project.";
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `Task deleted successfully. ${additionalMessage}`,
      ),
    );
});

const createSubTask = asyncHandler(async (req, res) => {
  const { title } = req.body;
  const { taskId, projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const task = await Tasks.findById(taskId);

  if (!task) {
    throw new ApiError(404, "Task does not exist.");
  }

  const subtask = await Subtask.create({
    title,
    task: new mongoose.Types.ObjectId(taskId),
    isCompleted: false,
    createdBy: new mongoose.Types.ObjectId(req.user._id),
  });

  return res
    .status(201)
    .json(new ApiResponse(201, subtask, "Subtask created successfully."));
});

const updateSubTask = asyncHandler(async (req, res) => {
  const { title, isCompleted } = req.body;
  const { subtaskId, projectId } = req.params;

  // PRD (project resource docs) mentioned req.params must accept the projectId so we can just check if the project exists before doing anything
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // can also handle this in index.js file in validators if you wish.
  if (!["true", "false"].includes(isCompleted)) {
    throw new ApiError(404, "Status is not valid.");
  }

  const subtask = await Subtask.findByIdAndUpdate(
    subtaskId,
    {
      title,
      isCompleted: Boolean(isCompleted),
    },
    { new: true },
  );

  if (!subtask) {
    throw new ApiError("Subtask not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask updated successfully."));
});

const deleteSubTask = asyncHandler(async (req, res) => {
  const { subtaskId, projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const subtask = await Subtask.findByIdAndDelete(subtaskId);

  if (!subtask) {
    throw new ApiError(404, "Subtask not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, subtask, "Subtask deleted successfully."));
});

export {
  createTask,
  createSubTask,
  updateTask,
  updateSubTask,
  deleteTask,
  deleteSubTask,
  getTaskById,
  getTasks,
};
