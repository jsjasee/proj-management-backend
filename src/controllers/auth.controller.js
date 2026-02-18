import { User } from "../models/user.models.js"; // this will help us query things from the database
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { emailVerificationMailgenContent, sendEmail } from "../utils/mail.js";

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

export { registerUser, login };
