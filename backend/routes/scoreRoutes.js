import express from "express";
const router = express.Router();

import {
  addScore,
  getScores,
  updateScore,
  deleteScore,
} from "../controllers/scoreController.js";
import { protect } from "../middlewares/authMiddleware.js";

router.post("/add", protect, addScore);
router.get("/", protect, getScores);
router.put("/:id", protect, updateScore);
router.delete("/:id", protect, deleteScore);

export default router;
