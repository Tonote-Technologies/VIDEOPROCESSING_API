import express from "express";
// controller methods
import { loomApi } from "../controllers/apiController.js";

const router = express.Router();

router.post("/loom-api", loomApi);

export default router;
