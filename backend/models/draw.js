import mongoose from "mongoose";

const drawSchema = new mongoose.Schema(
  {
    numbers: [Number], // 5 numbers

    type: {
      type: String,
      enum: ["random", "algorithm"],
      default: "random",
    },

    winners: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        matchCount: Number, // 3,4,5
        prize: Number,
        status: {
          type: String,
          enum: ["pending", "paid"],
          default: "pending",
        },
      },
    ],

    isPublished: {
      type: Boolean,
      default: false,
    },

    prizePool: {
      type: Number,
      default: 0,
    },

    tierPools: {
      five: Number,
      four: Number,
      three: Number,
    },

    jackpotRollOver: {
      type: Number,
      default: 0,
    },

    drawDate: {
      type: Date,
      default: Date.now,
    },

    isSimulation: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Draw || mongoose.model("Draw", drawSchema);
