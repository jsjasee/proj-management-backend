import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";
import { AvailableUserRole, UserRolesEnum } from "../utils/constants.js";

// suggested functionality: send an email when the project is created / when a user is added to a project

const getProjects = asyncHandler(async (req, res) => {
  // grab all the projects you have created. and you also want to get the USER in the response back also. since projectMember has both reference to the user AND project, you can start the query from there.
  // we can get req.user._id from the request
  // we are writing an aggregation pipeline to avoid making multiple queries. we start querying from ProjectMember
  const projects = await ProjectMember.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "projects",
        localField: "project",
        foreignField: "_id",
        as: "projects",
        pipeline: [
          {
            $lookup: {
              from: "projectmembers", // you can look up within a lookup ? is it looking up in those specific documents from the looked up document? what's the diff between pipeline in a lookup vs pipeline right after this lookup pipeline?
              localField: "_id",
              foreignField: "project",
              as: "projectmembers",
            },
          },
          {
            $addFields: {
              members: {
                $size: "$projectmembers",
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$project",
    },
    {
      $project: {
        project: {
          _id: 1, // means you keep this field
          name: 1,
          description: 1,
          members: 1,
          createdAt: 1,
          createdBy: 1,
        },
        role: 1,
        _id: 0, // we don't want the _id for this document?
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, projects, "Projects fetched successfully."));
});

const getProjectById = asyncHandler(async (req, res) => {
  const { projectId } = req.params; // the url should also mention exactly 'projectId'
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  const project = await Project.create({
    name,
    description,
    createdBy: new mongoose.Types.ObjectId(req.user._id), // this makes sures that we get a mongoDB object id! req.user._id alone will give the user id in STRING format, not mongoDB objectId
  });

  // creating a project member document as we create a project
  await ProjectMember.create({
    user: new mongoose.Types.ObjectId(req.user._id),
    project: new mongoose.Types.ObjectId(project._id),
    role: UserRolesEnum.ADMIN, // you are the admin of your own project
  });

  return res
    .status(201)
    .json(new ApiResponse(201, project, "Project created successfully"));
});

const updateProject = asyncHandler(async (req, res) => {
  const { name, description } = req.body; // we are allowing the name and desc of project to be updated
  const { projectId } = req.params; // the url part

  const project = await Project.findByIdAndUpdate(
    projectId,
    {
      name, // this is the same as 'name: name'
      description,
    },
    { new: true }, // new: true means it will return the MODIFIED aka latest version of document instead of the original
  );

  if (!project) {
    throw new ApiError(404, "Project not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findByIdAndDelete(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // should delete it's corresponding members in that project as well!
  const deletedProjectMembers = await ProjectMember.deleteMany({
    project: projectId,
  });
  if (!deletedProjectMembers) {
    throw new ApiError(404, "No members in this project.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, project, "Project deleted successfully"));
});

const addMembersToProject = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;
  const user = await User.findOne({ email }); // retrieve a SINGLE document based on the criteria given

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // first args is the criteria is search by, then the next args is what to update. we are just updating the role here. IF you are using findByIdAndUpdate -> the first args must be ONE ._id wrapped in mongoose.Types.ObjectId() not an object with different _ids to match
  await ProjectMember.findOneAndUpdate(
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
    },
    {
      user: new mongoose.Types.ObjectId(user._id),
      project: new mongoose.Types.ObjectId(projectId),
      role: role, // could be ADMIN or MEMBER etc.
    },
    {
      new: true, // returns the updated document
      upsert: true, // creates a new document if no document is found for this query -> so this adds the member to the project
    },
  );

  return res
    .status(201)
    .json(new ApiResponse(201, {}, "Project member added successfully."));
});

const getProjectMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const projectMembers = await ProjectMember.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $lookup: {
        from: "user",
        localField: "user",
        foreignField: "_id",
        as: "user",
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
        user: {
          $arrayElemAt: ["$user", 0], // or use $unwrap
        },
      },
    },
    {
      $project: {
        project: 1,
        user: 1,
        role: 1,
        createdAt: 1,
        updatedAt: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        projectMembers,
        "Project members retrieved successfuly",
      ),
    );
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { newRole } = req.body;

  if (!AvailableUserRole.includes(newRole)) {
    throw new ApiError(400, "Invalid role");
  }

  // find the member role and update it
  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(400, "Project member not found");
  }

  const updatedProjectMember = await ProjectMember.findByIdAndUpdate(
    projectMember._id,
    {
      role: newRole,
    },
    { new: true },
  );

  if (!updatedProjectMember) {
    throw new ApiError(400, "Project member not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedProjectMember,
        "Project member updated successfuly",
      ),
    );
});

const deleteMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  // find the member role and update it
  let projectMember = await ProjectMember.findOne({
    project: new mongoose.Types.ObjectId(projectId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!projectMember) {
    throw new ApiError(400, "Project member not found");
  }

  const deletedProjectMember = await ProjectMember.findByIdAndDelete(
    projectMember._id,
  );

  if (!deletedProjectMember) {
    throw new ApiError(400, "Project member not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        deletedProjectMember,
        "Project member deleted successfuly",
      ),
    );
});

export {
  addMembersToProject,
  createProject,
  getProjects,
  getProjectById,
  updateMemberRole,
  updateProject,
  getProjectMembers,
  deleteMember,
  deleteProject,
};
