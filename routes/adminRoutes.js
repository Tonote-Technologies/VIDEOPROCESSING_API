import express from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/adminController.js";
import { authUser, authAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authUser);
router.use(authAdmin);

router.get("/users", getAllUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
