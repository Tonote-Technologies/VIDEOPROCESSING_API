import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";

//@desc get all users
//@route GET /api/users
//@access Private
const getAllUsers = asyncHandler(async (req, res) => {
  // Get all users from MongoDB
  const users = await User.find().select("-password").lean();
  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }
  res.json(users);
});

// /@desc creates a new user
//@route POST /api/users
//@access Private
const createUser = asyncHandler(async (req, res) => {});

//@desc Update a user
//@route PATCH /api/users/
//@access Private
const updateUser = asyncHandler(async (req, res) => {});

//@desc Delete user(s)
//@route DELETE /api/user(s)
//@access Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const result = await user.deleteOne();
  const reply = `User ${result.full_name} with ID ${result._id} deleted`;
  res.status(201).json(reply);
});

export { getAllUsers, createUser, updateUser, deleteUser };
