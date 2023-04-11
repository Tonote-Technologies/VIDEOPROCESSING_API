import express from "express";
// controller methods
import {
  registerUser,
  loginUser,
  refreshToken,
  logout,
} from "../controllers/authController.js";
// middlewares
import { authUser } from "../middlewares/authMiddleware.js";
import { loginLimiter } from "../middlewares/loginLimiter.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.post("/logout", logout);
router.get("/refresh-token", refreshToken);

export default router;
