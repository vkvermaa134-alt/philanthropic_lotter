import crypto from "crypto";
import Razorpay from "razorpay";
import Subscription from "../models/Subscription.js";
import User from "../models/user.js";
import Charity from "../models/charity.js";
import {
  PLAN_PRICING,
  PRIZE_POOL_SHARE,
  CHARITY_MIN_PERCENT,
} from "../config/constants.js";

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in env");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const calculateEndDate = (startDate, plan) => {
  const endDate = new Date(startDate);

  if (plan === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return endDate;
};

const normalizeCharityPercent = (value) => {
  const percent = Number(value);
  if (Number.isNaN(percent) || percent < CHARITY_MIN_PERCENT) {
    return CHARITY_MIN_PERCENT;
  }

  return Math.min(percent, 100);
};

export const createSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { plan, charityId, charityPercentage } = req.body;

    if (!PLAN_PRICING[plan]) {
      return res.status(400).json({ message: "Unsupported plan" });
    }

    const existing = await Subscription.findOne({
      user: userId,
      status: "active",
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Active subscription already exists" });
    }

    const amount = PLAN_PRICING[plan];
    const charityPercent = normalizeCharityPercent(charityPercentage ?? 10);
    const charityContribution = Number(
      ((amount * charityPercent) / 100).toFixed(2)
    );
    const prizeContribution = Number((amount * PRIZE_POOL_SHARE).toFixed(2));

    const razorpay = getRazorpay();

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: "INR",
      receipt: `receipt_${userId}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId: userId.toString(),
        plan,
        charityId: charityId ?? "",
        charityPercentage: charityPercent.toString(),
      },
    });

    return res.status(200).json({
      message: "Razorpay order created",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      charityId,
      charityPercentage: charityPercent,
      charityContribution,
      prizeContribution,
    });
  } catch (error) {
    console.error("Subscription creation error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const confirmSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      plan,
      charityId,
      charityPercentage,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    if (!PLAN_PRICING[plan]) {
      return res.status(400).json({ message: "Unsupported plan" });
    }

    if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return res.status(400).json({ message: "Payment verification required" });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const razorpay = getRazorpay();
    await razorpay.payments.fetch(razorpayPaymentId);

    if (generatedSignature !== razorpaySignature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const existing = await Subscription.findOne({
      user: userId,
      status: "active",
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Active subscription already exists" });
    }

    const startDate = new Date();
    const endDate = calculateEndDate(startDate, plan);
    const amount = PLAN_PRICING[plan];
    const charityPercent = normalizeCharityPercent(charityPercentage ?? 10);
    const charityContribution = Number(
      ((amount * charityPercent) / 100).toFixed(2)
    );
    const prizeContribution = Number((amount * PRIZE_POOL_SHARE).toFixed(2));

    const subscription = await Subscription.create({
      user: userId,
      plan,
      amount,
      status: "active",
      startDate,
      endDate,
      charityId,
      charityPercentage: charityPercent,
      charityContribution,
      prizeContribution,
      paymentId: razorpayPaymentId,
      nextBillingDate: endDate,
    });

    const user = await User.findById(userId);
    user.subscriptionStatus = "active";
    user.subscriptionPlan = plan;
    user.charityPercentage = charityPercent;

    if (charityId) {
      user.charity = charityId;
      const charity = await Charity.findById(charityId);
      if (charity) {
        charity.totalDonations += charityContribution;
        await charity.save();
      }
    }

    await user.save();

    return res.status(201).json({
      message: "Subscription created successfully",
      subscription,
    });
  } catch (error) {
    console.error("Confirm subscription error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getSubscriptionStatus = async (req, res) => {
  try {
    // Check User model first (authoritative source)
    const user = await User.findById(req.user._id);
    if (user?.subscriptionStatus === "active") {
      const subscription = await Subscription.findOne({ user: req.user._id }).populate(
        "charityId"
      );
      return res.json({
        isSubscribed: true,
        subscription,
      });
    }
    
    // Fallback to checking Subscription collection
    const subscription = await Subscription.findOne({ 
      user: req.user._id, 
      status: "active" 
    }).populate("charityId");

    res.json({
      isSubscribed: Boolean(subscription?.status === "active"),
      subscription,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelSubscription = async (req, res) => {
  const subscription = await Subscription.findOne({ user: req.user._id });

  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" });
  }

  subscription.status = "cancelled";
  subscription.endDate = new Date();
  subscription.nextBillingDate = null;
  await subscription.save();

  const user = await User.findById(req.user._id);
  user.subscriptionStatus = "inactive";
  await user.save();

  res.json({ message: "Subscription cancelled" });
};

export const handleWebhook = async (req, res) => {
  const { event, data } = req.body;

  if (event === "subscription.renewed") {
    const { userId, plan, paymentId } = data;
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, plan);

    await Subscription.findOneAndUpdate(
      { user: userId },
      {
        plan,
        status: "active",
        startDate,
        endDate,
        paymentId,
        nextBillingDate: endDate,
      },
      { upsert: true }
    );

    await User.findByIdAndUpdate(userId, { subscriptionStatus: "active" });
  }

  if (event === "subscription.payment_failed") {
    await Subscription.findOneAndUpdate(
      { user: data.userId },
      { status: "cancelled" }
    );

    await User.findByIdAndUpdate(data.userId, { subscriptionStatus: "inactive" });
  }

  res.json({ received: true });
};
