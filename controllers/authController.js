
import User from "../models/userModel.js";
import {
  genAccessToken,
  genRefreshToken,
  firstLetterToUpperCase,
} from "../utils/utils.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import Jwt from "jsonwebtoken";
import { sendMail } from "../config/mail.js";
import { registerValidator } from "../utils/validate.js";

//@desc register a new user
//@route POST /api/auth/register
//@access Public
const registerUser = asyncHandler(async (req, res) => {
  // validation with joi
  const { error, value } = await registerValidator(req.body);
  if (error)
    return res
      .status(400)
      .json({ message: "Invalid input field, Please check" });

  const { first_name, last_name, email, password } = req.body;
  // Confirm required data fields
  if (!first_name || !last_name || !password || !email)
    return res.status(400).json({ message: "All fields are required" });

  // Check if duplicate email exists
  const userExists = await User.findOne({ email }).lean().exec();
  if (userExists)
    return res
      .status(409)
      .json({ message: "This email already exists! Please, login instead." });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10); // salt rounds
  const initials =
    first_name.charAt(0).toUpperCase() + last_name.charAt(0).toUpperCase();
  const full_name = `${firstLetterToUpperCase(
    first_name
  )} ${firstLetterToUpperCase(last_name)}`;

  const userObject = {
    first_name, //name
    last_name, //name
    full_name, //name
    email, //email
    initials, //initials
    password: hashedPassword, //password
  };

  // Create and store new user
  const user = await User.create(userObject);

  if (user) {
    //send mail template, first_name, to, subject
    sendMail("register", user.first_name, user.email, "Welcome on Board");
    //created
    res
      .status(201)
      .json({ message: `New user ${first_name} created`, data: user });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

///@desc auth user and get token
//@route POST /api/auth/login
//@access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Confirm required data fields
  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const user = await User.findOne({ email }).exec();

  if (!user) {
    return res.status(401).json({ message: "Email or Password not found" });
  }

  if (!user.active || user.is_deleted) {
    return res.status(401).json({
      message: "Your account has been deactivated, Please contact support",
    });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(401).json({ message: "Invalid Email or Password" });

  const accessToken = genAccessToken(user._id, user.full_name, user.email);
  const refreshToken = genRefreshToken(user._id, user.full_name, user.email);

  // Create secure cookie with refresh token
  res.cookie("shopfair", refreshToken, {
    httpOnly: true, //accessible only by web server
    secure: false, //https
    sameSite: "None", //cross-site cookie
    maxAge: 1 * 24 * 60 * 60 * 1000, //cookie expiry: set to match rT
    path: "/",
  });
  // Send accessToken containing username and roles
  res.json({ accessToken });
});

///@desc Refresh token
//@route GET /api/auth/refresh-token
//@access Public
const refreshToken = (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.shopfair)
    return res.status(401).json({ message: "Unauthorized" });

  const refreshToken = cookies.shopfair;

  Jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_KEY,
    asyncHandler(async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" });

      const user = await User.findById(decoded.id).exec();

      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const accessToken = genAccessToken(user._id, user.full_name, user.email);
      res.json({ accessToken });
    })
  );
};

// @desc Logout
// @route POST /auth/logout
// @access Public - just to clear cookie if exists
const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.shopfair) return res.sendStatus(204); //No content
  res.clearCookie("shopfair", {
    httpOnly: true,
    sameSite: "None",
    secure: false,
  });
  res.json({ message: "Cookie cleared" });
};

export { registerUser, loginUser, refreshToken, logout };
