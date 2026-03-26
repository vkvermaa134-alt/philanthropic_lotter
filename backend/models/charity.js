import mongoose from "mongoose";

const charitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    description: String,

    image: String,

    cause: String,

    website: String,

    featured: {
      type: Boolean,
      default: false,
    },

    totalDonations: {
      type: Number,
      default: 0,
    },

    events: [
      {
        title: String,
        description: String,
        date: Date,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Charity || mongoose.model("Charity", charitySchema);
