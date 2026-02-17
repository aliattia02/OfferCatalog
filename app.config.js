// app.config.js - Dynamic configuration with environment variables
const { withSentry } = require("@sentry/react-native/expo");

// Load environment variables from .env file
require('dotenv').config();

const config = require("./app.json");

// Inject environment variables into expo.extra
config.expo.extra = {
  ...config.expo.extra,
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_ANDROID,
  EXPO_PUBLIC_FIREBASE_APP_ID_WEB: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_WEB,
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
  SENTRY_DSN: process.env.SENTRY_DSN,
};

module.exports = withSentry(config.expo, {
  organization: process.env.SENTRY_ORG || "o4510741401436160",
  project: process.env.SENTRY_PROJECT || "daily-deals",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Only upload source maps in production builds
  uploadSourceMaps: process.env.EAS_BUILD_PROFILE === "production",
});