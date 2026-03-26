import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    plan: {
      type: String,
      enum: ["monthly", "yearly"],
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },

    amount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    charityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Charity",
    },

    charityPercentage: {
      type: Number,
      default: 10,
    },

    charityContribution: Number,

    prizeContribution: Number,

    nextBillingDate: Date,

    autoRenew: {
      type: Boolean,
      default: true,
    },

    startDate: Date,
    endDate: Date,

    paymentId: String, // Stripe ID
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
