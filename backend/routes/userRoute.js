import express from "express";
const router = express.Router();

import {
  getProfile,
  updateProfile,
  getDashboard,
} from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/dashboard", protect, getDashboard);

export default router;
