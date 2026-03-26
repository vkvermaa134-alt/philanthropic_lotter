import Score from "../models/score.js";
import Subscription from "../models/Subscription.js";
import Draw from "../models/draw.js";
import Winner from "../models/winner.js";
import Charity from "../models/charity.js";
import User from "../models/user.js";

export const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("-password")
      .populate("charity", "name totalDonations");

    res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    ["name", "role", "subscriptionStatus", "subscriptionPlan", "charity", "charityPercentage"].forEach(
      (field) => {
        if (updates[field] !== undefined) {
          user[field] = updates[field];
        }
      }
    );

    await user.save();

    res.json({ message: "User updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: "active",
    });
    const pendingWinners = await Winner.countDocuments({
      status: "pending",
    });

    const prizeAggregation = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalPrizeContribution: { $sum: "$prizeContribution" },
        },
      },
    ]);

    const charityAggregation = await Subscription.aggregate([
      {
        $group: {
          _id: null,
          totalCharityContribution: { $sum: "$charityContribution" },
        },
      },
    ]);

    const drawStats = await Draw.countDocuments();

    const featuredCharities = await Charity.find()
      .sort({ totalDonations: -1 })
      .limit(3);

    res.json({
      totals: {
        totalUsers,
        activeSubscriptions,
        drawCount: drawStats,
        pendingWinners,
      },
      prizePool:
        prizeAggregation[0]?.totalPrizeContribution ?? 0,
      charityPool:
        charityAggregation[0]?.totalCharityContribution ?? 0,
      featuredCharities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const totalScores = await Score.countDocuments();
    const averageScoreResult = await Score.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$value" },
        },
      },
    ]);

    const drawHistory = await Draw.find()
      .sort({ drawDate: -1 })
      .limit(5)
      .select("numbers prizePool winners drawDate");

    const charityBreakdown = await Charity.find()
      .sort({ totalDonations: -1 })
      .limit(5)
      .select("name totalDonations");

    res.json({
      scores: {
        totalEntries: totalScores,
        averageScore: averageScoreResult[0]?.avgScore ?? null,
      },
      recentDraws: drawHistory,
      charityBreakdown,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const publishDraw = async (req, res) => {
  try {
    const draw = await Draw.findOne({ isPublished: false }).sort({
      drawDate: -1,
    });

    if (!draw) {
      return res.status(404).json({ message: "No draft draw found" });
    }

    draw.isPublished = true;
    await draw.save();

    res.json({ message: "Draw published", draw });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const promoteToAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "admin" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User promoted to admin", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const demoteFromAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role: "user" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User demoted to regular user", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
