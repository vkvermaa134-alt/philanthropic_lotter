import Charity from "../models/charity.js";

export const getAllCharities = async (req, res) => {
  try {
    const { q, featured } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (featured !== undefined) {
      filter.featured = featured === "true";
    }

    const charities = await Charity.find(filter).sort({ name: 1 });

    res.json({
      total: charities.length,
      charities,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCharityById = async (req, res) => {
  try {
    const charity = await Charity.findById(req.params.id);

    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    res.json(charity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCharity = async (req, res) => {
  try {
    const charity = await Charity.create(req.body);
    res.status(201).json(charity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCharity = async (req, res) => {
  try {
    const updates = req.body;
    const charity = await Charity.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    res.json(charity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCharity = async (req, res) => {
  try {
    const charity = await Charity.findByIdAndDelete(req.params.id);

    if (!charity) {
      return res.status(404).json({ message: "Charity not found" });
    }

    res.json({ message: "Charity removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
