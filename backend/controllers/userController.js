import User from "../models/user.js";
import Score from "../models/score.js";

// @desc Get profile
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// @desc Update profile
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    user.name = req.body.name || user.name;

    const updated = await user.save();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Dashboard
export const getDashboard = async (req, res) => {
  try {
    const scores = await Score.find({ user: req.user._id });

    res.json({
      user: req.user,
      scores,
      totalScores: scores.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};