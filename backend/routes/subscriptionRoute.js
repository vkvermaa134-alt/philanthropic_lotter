import express from "express";
const router = express.Router();

import {
  createSubscription,
  confirmSubscription,
  getSubscriptionStatus,
  cancelSubscription,
  handleWebhook,
} from "../controllers/subscriptionController.js";
import { protect } from "../middlewares/authMiddleware.js";

router.post("/create", protect, createSubscription);
router.post("/confirm", protect, confirmSubscription);
router.get("/status", protect, getSubscriptionStatus);
router.post("/cancel", protect, cancelSubscription);
router.post("/webhook", handleWebhook);

export default router;
