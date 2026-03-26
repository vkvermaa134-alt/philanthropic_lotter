import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },

    subscriptionPlan: {
      type: String,
      enum: ["monthly", "yearly"],
    },

    charity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
    },

    charityPercentage: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);