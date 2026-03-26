import express from "express";
const router = express.Router();

import {
  runDraw,
  getLatestDraw,
  getDrawHistory,
  simulateDraw,
} from "../controllers/drawController.js";
import {
  protect,
  adminOnly,
} from "../middlewares/authMiddleware.js";

router.post("/run", protect, adminOnly, runDraw);
router.get("/latest", protect, getLatestDraw);
router.get("/history", protect, getDrawHistory);
router.post("/simulate", protect, adminOnly, simulateDraw);

export default router;
