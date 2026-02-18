import { User } from "../models/user.models.js"; // this will help us query things from the database
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  emailVerificationMailgenContent,
  forgotPasswordMailgenContent,
  sendEmail,
} from "../utils/mail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  // can either use try catch or async-handler that we created previously
  try {
    const user = await User.findById(userId); // this allows us to get access to all the methods in the mongoose module AND also our own methods AND verifies that user exists
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token to DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // while saving we don't want all the validations for all the other fields to run because we are just updating one field, hence we turn off 'validateBeforeSave'

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // how to accept data from front-end (it usually comes from the 'body', 'headers' or 'params' (aka in the url). we are expecting the data to come from the body for this project)

  // 1. take some data
  const { email, username, password, role } = req.body; // this is to destructure the data, javascript syntax

  // 2. validate data (done in a later part)

  // 3. check DB
  const existedUser = await User.findOne({
    $or: [{ username }, { email }], // um what is this syntax? what's the $? also this is saying if you find any entry with the username or email, DON'T register
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists", []); // [] means we don't want to pass anything for that field
  }

  // database operation so we HAVE to use await
  const user = await User.create({
    email,
    password,
    username,
    isEmailVerified: false,
  });

  // 4. generate the crypto (temp, no data attached) token

  // now the user object that is created HAS ACCESS to the methods we defined in user.models.js (our OWN functionality). 'User' is just a mongoose model, cannot use OUR OWN methods attached to the schema

  // destructure the data that we get back
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false }); // you know which fields you are changing and know what you are doing to turn off 'validateBeforeSave'

  // 5. Send email with the same token generated & provide whatever options that we require
  await sendEmail({
    email: user?.email, // this means if user is not empty aka we have the user, we get the email
    subject: "Please verify your email",

    // we dynamically generate the email link, because a link on localhost vs hosted on vercel etc. is VERY different (req.protocol is like http vs https, the host is like localhost or example.com etc.) THEN the api route in project document
    // we will create the verify-email route & controller soon to process unhashed token

    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  // 6. Send a response BACK to the user, also the data we send can be LIMITED. NO NEED send everything.
  // why id - because we have access to it, and also '-' means we don't want (remove) that field to be sent
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering a user");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { user: createdUser },
        "User registered successfully and verification email has been sent to your email",
      ),
    );
});

const login = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "User does not exist. Please register.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid credentials");
  }

  // issue the tokens once user successfully logged in
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  // We use the same mechanism as register user when trying to send the data to the user.

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -emailVerificationToken -emailVerificationExpiry",
  );

  const options = {
    httpOnly: true, // secure cookies, only browser can manipulate these cookies
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // how to logout user -> we need to get the refresh token first
  // we also need to create a logout route
  // we have req.user because we have attached user obj to the request after verifying that access token is valid in the middlewares code
  await User.findByIdAndUpdate(
    req.user._id, // what to find: find the user based on id; then the second part is an object with $set with what fields you want to update.
    {
      $set: {
        refreshToken: "",
      },
    },
    {
      new: true, // once everything is done, give the updated / newest version of the object
    },
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  // send the response but need to clear the cookies (remove all traces)
  // then we can test the logout in postman! but just make sure to run the login route first, so you have the stored cookies, then the logout will work (after that the cookies in postman will be cleared)
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { verificationToken } = req.params; // this give you access to the url! and get the temp (no data) token from url. this 'verificationToken' comes from the url itself

  if (!verificationToken) {
    throw new ApiError(400, "Email verification token is missing");
  }

  // when sending the verification email (in the registerUser controller) we attach the unhashedtoken to the url because we don't want the user to figure out what we are doing?? so we need to hash it again and then compare with our own hashed version and see if it matches.

  let hashedToken = crypto
    .createHash("sha256")
    .update(verificationToken) // what does this do?
    .digest("hex"); // what is the hex digest?

  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() }, // gt means greater than now, you are specifying that this field should be more than the current time, aka token is still valid!
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or expired.");
  }

  // clean up the email verification token field and email verification token expiry (once the user is verified we want to clean up these fields)
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  user.isEmailVerified = true;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isEmailVerified: true,
      },
      "Email is verified",
    ),
  );
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id);

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // if user tried to resend verification email if they are already verified
  if (user.isEmailVerified) {
    throw new ApiError(409, "Email is already verified");
  }

  // if the user is not verified and wants to get a new email, well just repeat the step from registerUser controller

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;
  await user.save({ validateBeforeSave: false });

  await sendEmail({
    email: user?.email,
    subject: "Please verify your email",

    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`,
    ),
  });

  // once email is sent send a response back
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Mail has been sent to your email ID"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access");
  }

  // decode the refresh token
  try {
    const decodedRefreshToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedRefreshToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // we are checking the database and we are checking if the refresh token both matches up (both the one that the user has and the refresh token in the db)
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired"); // so if both tokens does not match up, do we need to issue a new one? and how come we didn't even use the REFRESH_TOKEN_EXPIRY property in the DB at all??
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id); // we are renaming the refreshToken from the obj to 'newRefreshToken' so we know which is which when assigning it to the DB's refreshToken

    // remember to update the refresh token as well!!
    user.refreshToken = newRefreshToken;
    await user.save();

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed.",
        ),
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token.");
  }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  // when the user clicks on forgot password, we will get their 'email' from the body
  const { email } = req.body;

  // search the email in the DB
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  // if user exists (process is the SAME, unHashedToken for email, hashedToken we keep for ourselves so hackers cannot use our hashed version to decode it)
  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  await user.save({ validateBeforeSave: false });

  // taken from the registerUser controller BUT instead of dynamically creating the URL, we just redirect the user directly, this is what most web-apps do?
  await sendEmail({
    email: user?.email,
    subject: "Password Reset Request",
    mailgenContent: forgotPasswordMailgenContent(
      user.username,
      `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Password reset mail has been sent to your mail",
      ),
    );
});

const resetForgotPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // find the user based on the hashedToken (previously we saved this hashedToken on the DB!)
  const user = await User.findOne({
    forgotPasswordToken: hashedToken,
    forgotPasswordExpiry: { $gt: Date.now() }, // the expiry should be in the future
  });

  if (!user) {
    throw new ApiError(489, "Token is invalid or expired.");
  }

  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  user.password = newPassword; // the moment you update the password field, the pre-hook (in user.models.js) will be activated and hash this password, and then update it.

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password reset was successful"));
});

// this controller only works when the user is LOGGED IN and wants to change their password (diff from 'resetForgotPassword')
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body; // we know the oldPassword because user is LOGGED IN

  const user = await User.findById(req.user?._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword); // we have defined this method in user.models.js

  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  // save the new password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});
// const getCurrentUser = asyncHandler(async (req, res) => {

// })

export {
  registerUser,
  login,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendEmailVerification,
  refreshAccessToken,
  forgotPasswordRequest,
  resetForgotPassword,
  changeCurrentPassword,
};
