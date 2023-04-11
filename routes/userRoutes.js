import express from "express";
// controller methods
import {
  userProfile,
  updateUserProfile,
  deactivateUserProfile,
} from "../controllers/userController.js";
// middlewares
import { authUser } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/profile", authUser, userProfile);
router.post("/deactivate-profile", authUser, deactivateUserProfile);

export default router;
