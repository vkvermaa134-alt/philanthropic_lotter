import mongoose from "mongoose";

const winnerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    draw: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Draw",
    },

    proof: {
      type: String, // image URL
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "paid"],
      default: "pending",
    },

    prize: Number,
  },
  { timestamps: true }
);

export default mongoose.models.Winner || mongoose.model("Winner", winnerSchema);