import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";

//@desc get registered user's details
//@route GET /api/user/profile
//@access Protected (user)
const userProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Confirm required data fields
  if (!userId) {
    return res.status(400).json({ message: "Unathenticated" });
  }

  let user;
  try {
    user = await User.findById(userId, "-password").lean().exec();
    if (user) {
      return res.json({ data: user });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return res.status(404).json({ message: error });
  }
});

//@desc Update a user
//@route PUT /api/user
//@access Protected (user)
const updateUserProfile = asyncHandler(async (req, res) => {});

//@desc Deactivate my account
//@route POST /api/user/deactivate-profile
//@access Protected (user)
const deactivateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // Confirm required data fields
  if (!userId) {
    return res.status(400).json({ message: "Unathenticated" });
  }
  // find user by id
  const user = await User.findByIdAndUpdate(userId, {
    active: false,
    is_deleted: true,
    deletedAt: Date.now(),
    updatedAt: Date.now(),
  })
    .lean()
    .exec();
  if (user) {
    const cookies = req.cookies;
    if (!cookies?.shopfair) return res.sendStatus(204); //No content
    res.clearCookie("shopfair", {
      httpOnly: true,
      sameSite: "None",
      secure: false,
    });
    return res.status(201).json({ message: "Account deactivated" });
  } else {
    return res.status(400).json({ message: "Unanthenticated" });
  }
});

export { userProfile, updateUserProfile, deactivateUserProfile };
