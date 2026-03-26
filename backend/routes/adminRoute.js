import express from "express";
const router = express.Router();

import {
  getAllUsers,
  updateUser,
  getReports,
  getAnalytics,
  publishDraw,
  promoteToAdmin,
  demoteFromAdmin,
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";

router.get("/users", protect, adminOnly, getAllUsers);
router.put("/users/:id", protect, adminOnly, updateUser);

router.get("/reports", protect, adminOnly, getReports);
router.get("/analytics", protect, adminOnly, getAnalytics);

router.post("/draw/publish", protect, adminOnly, publishDraw);
router.post("/promote", protect, adminOnly, promoteToAdmin);
router.post("/demote", protect, adminOnly, demoteFromAdmin);

export default router;