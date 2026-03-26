import express from "express";
const router = express.Router();

import {
  registerUser,
  loginUser,
  getMe,
} from "../controllers/authController.js";

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", getMe);

export default router;