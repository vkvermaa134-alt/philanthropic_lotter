import Score from "../models/score.js";
import Subscription from "../models/Subscription.js";
import User from "../models/user.js";

const ensureActiveSubscriber = async (userId) => {
  // Check User model first
  const user = await User.findById(userId);
  if (user?.subscriptionStatus === "active") {
    return true;
  }
  
  // Fallback to checking Subscription collection
  return Subscription.exists({ user: userId, status: "active" });
};

const formatDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// @desc Add score (max 5 logic)
export const addScore = async (req, res) => {
  try {
    const { value, date } = req.body;
    const userId = req.user._id;

    if (!(await ensureActiveSubscriber(userId))) {
      return res
        .status(403)
        .json({ message: "Subscription must be active to add scores" });
    }

    if (typeof value !== "number" || value < 1 || value > 45) {
      return res.status(400).json({
        message: "Score value must be a number between 1 and 45 (Stableford)",
      });
    }

    const parsedDate = formatDate(date || Date.now());
    if (!parsedDate) {
      return res.status(400).json({ message: "Valid date is required" });
    }

    const scores = await Score.find({ user: userId }).sort({ date: 1 });

    if (scores.length >= 5) {
      await Score.findByIdAndDelete(scores[0]._id);
    }

    const newScore = await Score.create({
      user: userId,
      value,
      date: parsedDate,
    });

    const latestScores = await Score.find({ user: userId }).sort({
      date: -1,
    });

    res.status(201).json({
      message: "Score logged",
      score: newScore,
      scores: latestScores,
      totalScores: latestScores.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all scores (latest first)
export const getScores = async (req, res) => {
  try {
    const userId = req.user._id;
    const scores = await Score.find({ user: userId }).sort({ date: -1 });

    res.json({
      total: scores.length,
      scores,
      latestScore: scores[0] || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update score
export const updateScore = async (req, res) => {
  try {
    const score = await Score.findById(req.params.id);

    if (!score) {
      return res.status(404).json({ message: "Score not found" });
    }

    const { value, date } = req.body;

    if (value !== undefined) {
      if (typeof value !== "number" || value < 1 || value > 45) {
        return res
          .status(400)
          .json({ message: "Score value must be between 1 and 45" });
      }

      score.value = value;
    }

    if (date) {
      const parsed = formatDate(date);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid date" });
      }

      score.date = parsed;
    }

    const updated = await score.save();

    res.json({ message: "Score updated", score: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete score
export const deleteScore = async (req, res) => {
  try {
    await Score.findByIdAndDelete(req.params.id);

    res.json({ message: "Score deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
