// server.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

import connectDB from "./config/db.js";

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoute.js";
import scoreRoutes from "./routes/scoreRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoute.js";
import drawRoutes from "./routes/drawRoute.js";
import charityRoutes from "./routes/charityRoute.js";
import adminRoutes from "./routes/adminRoute.js";

import { protect } from "./middlewares/authMiddleware.js";

connectDB();

const app = express();

// ✅ CORS FIX
app.use(
  cors()
);


app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", protect, userRoutes);
app.use("/api/scores", protect, scoreRoutes);
app.use("/api/subscription", protect, subscriptionRoutes);
app.use("/api/draw", protect, drawRoutes);
app.use("/api/charities", charityRoutes);
app.use("/api/admin", protect, adminRoutes);

// Start server
app.listen(5001, () => {
  console.log("Server running on port 5001");
});