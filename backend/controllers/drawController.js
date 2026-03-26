import mongoose from "mongoose";
import Score from "../models/score.js";
import Draw from "../models/draw.js";
import Winner from "../models/winner.js";
import Subscription from "../models/Subscription.js";
import {
  PLAN_PRICING,
  PRIZE_POOL_SHARE,
  PRIZE_ALLOCATION,
  DRAW_NUMBER_RANGE,
} from "../config/constants.js";

const matchKeyMap = {
  5: "five",
  4: "four",
  3: "three",
};

const roundValue = (value, decimals = 2) =>
  Number(Number(value).toFixed(decimals));

const collectActiveSubscriptionData = async () => {
  const activeSubs = await Subscription.find({ status: "active" });
  const userIds = activeSubs
    .map((sub) => sub.user?.toString())
    .filter((id) => Boolean(id));

  const uniqueUserIds = [...new Set(userIds)];

  const totalPrizeContributions = activeSubs.reduce((total, sub) => {
    let contribution = sub.prizeContribution;
    if (contribution === undefined) {
      contribution =
        (PLAN_PRICING[sub.plan] ?? 0) * PRIZE_POOL_SHARE;
    }
    return total + (contribution ?? 0);
  }, 0);

  return {
    activeUserIds: uniqueUserIds,
    totalPrizeContributions,
  };
};

const collectLatestScores = async (userIds) => {
  if (!userIds.length) {
    return [];
  }

  const objectIds = userIds.map((id) => new mongoose.Types.ObjectId(id));
  const entries = await Score.aggregate([
    { $match: { user: { $in: objectIds } } },
    { $sort: { user: 1, date: -1 } },
    {
      $group: {
        _id: "$user",
        values: { $push: "$value" },
      },
    },
    {
      $project: {
        user: "$_id",
        values: { $slice: ["$values", 5] },
      },
    },
  ]);

  return entries.map((entry) => ({
    user: entry.user,
    values: entry.values,
  }));
};

const generateRandomNumbers = () => {
  const { min, max } = DRAW_NUMBER_RANGE;
  const generated = new Set();
  while (generated.size < 5) {
    const next = Math.floor(Math.random() * (max - min + 1)) + min;
    generated.add(next);
  }
  return Array.from(generated);
};

const generateAlgorithmicNumbers = (entries) => {
  const frequency = {};
  entries.forEach((entry) => {
    entry.values.forEach((value) => {
      frequency[value] = (frequency[value] || 0) + 1;
    });
  });

  const sorted = Object.entries(frequency).sort((a, b) => {
    if (b[1] === a[1]) {
      return Number(a[0]) - Number(b[0]);
    }
    return b[1] - a[1];
  });

  const selected = sorted.slice(0, 5).map((entry) => Number(entry[0]));
  const uniqueSelected = [...new Set(selected)];

  while (uniqueSelected.length < 5) {
    const next = generateRandomNumbers()[0];
    if (!uniqueSelected.includes(next)) {
      uniqueSelected.push(next);
    }
  }

  return uniqueSelected;
};

const evaluateMatches = (numbers, entries) => {
  const buckets = {
    5: [],
    4: [],
    3: [],
  };

  entries.forEach((entry) => {
    const valueSet = new Set(entry.values);
    const matchCount = numbers.reduce(
      (count, value) => (valueSet.has(value) ? count + 1 : count),
      0
    );

    if (matchCount >= 3) {
      buckets[matchCount].push(entry);
    }
  });

  return buckets;
};

const computeTierPools = (totalPool, rollover) => {
  const basePool = roundValue(totalPool);
  const fivePool = roundValue(basePool * PRIZE_ALLOCATION.five + rollover);
  const fourPool = roundValue(basePool * PRIZE_ALLOCATION.four);
  const threePool = roundValue(basePool * PRIZE_ALLOCATION.three);

  return {
    five: fivePool,
    four: fourPool,
    three: threePool,
  };
};

const distributePrizes = (matchBuckets, tierPools) => {
  const winnerRecords = [];
  const summary = {
    matches: {
      5: matchBuckets[5].length,
      4: matchBuckets[4].length,
      3: matchBuckets[3].length,
    },
  };

  let rolloverAmount = tierPools.five;

  [5, 4, 3].forEach((matchCount) => {
    const bucket = matchBuckets[matchCount];

    if (!bucket.length) {
      return;
    }

    const poolKey = matchKeyMap[matchCount];
    const pool = tierPools[poolKey] ?? 0;
    const prizePerWinner = roundValue(pool / bucket.length);

    if (matchCount === 5) {
      rolloverAmount = 0;
    }

    bucket.forEach((entry) => {
      winnerRecords.push({
        user: entry.user,
        matchCount,
        prize: prizePerWinner,
        status: "pending",
      });
    });
  });

  return { winnerRecords, summary, rolloverAmount };
};

const buildDrawPayload = async ({ type, persist }) => {
  const { activeUserIds, totalPrizeContributions } =
    await collectActiveSubscriptionData();

  if (!activeUserIds.length) {
    throw new Error("No active subscribers available for draw");
  }

  const entries = await collectLatestScores(activeUserIds);

  if (!entries.length) {
    throw new Error("No score entries available for active subscribers");
  }

  const previousDraw = await Draw.findOne().sort({ createdAt: -1 });
  const rollover = previousDraw?.jackpotRollOver ?? 0;

  if (!totalPrizeContributions && rollover === 0) {
    throw new Error("Prize pool is empty; add subscriptions first");
  }

  const numbers =
    type === "algorithm"
      ? generateAlgorithmicNumbers(entries)
      : generateRandomNumbers();

  const matchBuckets = evaluateMatches(numbers, entries);
  const tierPools = computeTierPools(totalPrizeContributions, rollover);
  const { winnerRecords, summary, rolloverAmount } = distributePrizes(
    matchBuckets,
    tierPools
  );

  const prizePool = roundValue(totalPrizeContributions + rollover);

  const drawPayload = {
    numbers,
    type,
    winners: winnerRecords,
    prizePool,
    tierPools,
    jackpotRollOver: rolloverAmount,
    isSimulation: !persist,
    drawDate: new Date(),
  };

  if (!persist) {
    return {
      ...drawPayload,
      summary,
      entryCount: entries.length,
    };
  }

  const drawDoc = await Draw.create(drawPayload);

  if (winnerRecords.length) {
    const winnerDocs = winnerRecords.map((winner) => ({
      ...winner,
      draw: drawDoc._id,
    }));
    await Winner.insertMany(winnerDocs);
  }

  return {
    draw: drawDoc,
    summary,
    entryCount: entries.length,
  };
};

export const runDraw = async (req, res) => {
  try {
    const type = req.body.type || "random";
    const drawResult = await buildDrawPayload({ type, persist: true });

    res.status(201).json({
      message: "Draw executed",
      draw: drawResult.draw,
      summary: drawResult.summary,
      entryCount: drawResult.entryCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLatestDraw = async (req, res) => {
  try {
    const draw = await Draw.findOne().sort({ drawDate: -1 });

    if (!draw) {
      return res.status(404).json({ message: "No draw found" });
    }

    res.json(draw);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDrawHistory = async (req, res) => {
  try {
    const draws = await Draw.find()
      .sort({ drawDate: -1 })
      .limit(10)
      .lean();

    res.json({
      total: draws.length,
      draws,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const simulateDraw = async (req, res) => {
  try {
    const type = req.body.type || "random";
    const simulation = await buildDrawPayload({ type, persist: false });

    res.json({
      message: "Draw simulation",
      ...simulation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
