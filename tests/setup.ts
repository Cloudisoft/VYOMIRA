import "dotenv/config";
process.env.PAYMENTS_MODE ??= "test";
process.env.RAZORPAY_WEBHOOK_SECRET = "whsec_test";
