import mongoose from "mongoose";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");
  // MAKE SURE the 'accessToken' key matches what is in the response json! (when u test the login route, look at the response json, the key is 'accessToken')
  // or you can fetch the accessToken via the header - but make sure to replace 'Bearer' with nothing so you end up with the access token ONLY

  if (!token) {
    throw new ApiError(401, "Unauthorized request"); // abort the request
  }

  // safely decode aka validate the access token (how does the decoding work? is this the signing process..?)
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET); // this is an object
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
    );

    // how do u know _id is there - check user.models.js, we have provided the user._id property in the payload when we issue an accessToken to the user. (also how come the function only has the payload and secret.. where's the header part in the function when we issue the jwt???)
    // for the select() refer to your auth.controller.js to remove the same fields that you don't want

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user; // add an additional property -> user.
    next(); // proceed to the next middleware or the next part of the controller itself
  } catch (error) {
    throw new ApiError(401, "Invalid access token.");
  }
});

export const validateProjectPermission = (role = []) => {
  // make sure to RETURN a function because when using the validator in the project.routes.js, express.js requires FUNCTIONS to be present as the arguments not a function call eg. in router.route("/").get(getProjects), getProjects is a function ref not a function call.
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!projectId) {
      throw new ApiError(400, "Project id is missing");
    }

    // find the project member so we can find its role
    const projectMember = await ProjectMember.findOne({
      project: new mongoose.Types.ObjectId(projectId),
      user: new mongoose.Types.ObjectId(req.user._id), // this ASSUMES THAT THIS MIDDLEWARE ALWAYS RUN AFTER VERIFY JWT MIDDLEWARE
    });

    if (!projectMember) {
      throw new ApiError(
        400,
        "Project not found or user is not found for this project",
      );
    }

    const givenRole = projectMember?.role;

    req.user.role = givenRole; // this is just for reference, adding this field to the request

    // now you have to check if the givenRole matches with the role args that is passed in which is like ["admin"]

    if (!role.includes(givenRole)) {
      throw new ApiError(
        403,
        "You do not have permission to perform this action.",
      );
    }

    next(); // pass it on to the next middleware if there is or the next controller.
  });
};
