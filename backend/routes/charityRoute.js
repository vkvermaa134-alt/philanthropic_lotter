import express from "express";
const router = express.Router();

import {
  getAllCharities,
  getCharityById,
  createCharity,
  updateCharity,
  deleteCharity,
} from "../controllers/charityController.js";

router.get("/", getAllCharities);
router.get("/:id", getCharityById);
router.post("/", createCharity);
router.put("/:id", updateCharity);
router.delete("/:id", deleteCharity);

export default router;