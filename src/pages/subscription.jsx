import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import API from "../../services/api";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_your_key_here");

const SubscriptionForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [selectedCharity, setSelectedCharity] = useState("");
  const [charityPercentage, setCharityPercentage] = useState(10);
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(userData));

    // Check if user already has active subscription
    API.get("/subscription/status")
      .then((res) => {
        if (res.data.isSubscribed) {
          setHasActiveSubscription(true);
          navigate("/dashboard");
          return;
        }
      })
      .catch(() => {
        // Continue if check fails
      });

    // Fetch charities
    API.get("/charities")
      .then((res) => setCharities(res.data.charities || []))
      .catch(() => {});
  }, [navigate]);

  const plans = {
    monthly: {
      name: "Monthly Plan",
      price: 1200,
      period: "month",
      description: "Perfect for casual players",
    },
    yearly: {
      name: "Yearly Plan",
      price: 12000,
      period: "year",
      description: "Best value for dedicated golfers",
      savings: "Save ₹2,400 annually",
    },
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create payment method
      const cardElement = elements.getElement(CardElement);
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        alert(`Payment failed: ${error.message}`);
        return;
      }

      // Create subscription
      const response = await API.post("/subscription/create", {
        plan: selectedPlan,
        charityId: selectedCharity || undefined,
        charityPercentage: parseInt(charityPercentage),
        paymentMethodId: paymentMethod.id,
      });

      alert("Subscription created successfully!");
      navigate("/dashboard");
    } catch (error) {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: "16px",
        color: "#424770",
        "::placeholder": {
          color: "#aab7c4",
        },
      },
      invalid: {
        color: "#9e2146",
      },
    },
  };

  if (hasActiveSubscription) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              You're Already Subscribed!
            </h1>
            <p className="text-gray-600 mb-6">
              You have an active subscription. You can play the lottery now.
            </p>
            <button
              onClick={() => navigate("/lottery")}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Play Golf Lottery
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Golf Lottery Plan
          </h1>
          <p className="text-xl text-gray-600">
            Support charities while playing the lottery
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Plan Selection */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Select Your Plan</h2>

            <div className="space-y-4">
              {Object.entries(plans).map(([key, plan]) => (
                <div
                  key={key}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedPlan === key
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-green-300"
                  }`}
                  onClick={() => setSelectedPlan(key)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="text-gray-600">{plan.description}</p>
                      <p className="text-2xl font-bold text-green-600 mt-2">
                        ₹{plan.price}
                        <span className="text-sm font-normal text-gray-500">
                          /{plan.period}
                        </span>
                      </p>
                      {plan.savings && (
                        <p className="text-sm text-green-600 font-medium mt-1">
                          {plan.savings}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        checked={selectedPlan === key}
                        onChange={() => setSelectedPlan(key)}
                        className="w-5 h-5 text-green-600"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-6">Payment Details</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Charity Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support a Charity (Optional)
                </label>
                <select
                  value={selectedCharity}
                  onChange={(e) => setSelectedCharity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Choose a charity...</option>
                  {charities.map((charity) => (
                    <option key={charity._id} value={charity._id}>
                      {charity.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Charity Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Charity Contribution: {charityPercentage}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={charityPercentage}
                  onChange={(e) => setCharityPercentage(e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Card Element */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Information
                </label>
                <div className="border border-gray-300 rounded-md p-3">
                  <CardElement options={cardStyle} />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Order Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span>{plans[selectedPlan].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price:</span>
                    <span>₹{plans[selectedPlan].price}</span>
                  </div>
                  {selectedCharity && (
                    <div className="flex justify-between">
                      <span>Charity Contribution:</span>
                      <span>
                        ₹{Math.round((plans[selectedPlan].price * charityPercentage) / 100)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>Total:</span>
                    <span>₹{plans[selectedPlan].price}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!stripe || loading}
                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
                  !stripe || loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Processing..." : `Subscribe for ₹${plans[selectedPlan].price}`}
              </button>
            </form>
          </div>
        </div>

        {/* Features */}
        <div className="mt-12 bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">
            What You Get
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-semibold mb-2">Unlimited Plays</h3>
              <p className="text-gray-600">
                Add up to 5 golf scores per draw, every draw
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="font-semibold mb-2">Win Big Prizes</h3>
              <p className="text-gray-600">
                Chance to win from the prize pool every week
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">❤️</div>
              <h3 className="font-semibold mb-2">Support Charities</h3>
              <p className="text-gray-600">
                Part of your subscription helps local charities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Subscription() {
  return (
    <Elements stripe={stripePromise}>
      <SubscriptionForm />
    </Elements>
  );
}