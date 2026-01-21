// app.config.js - Sentry source map upload configuration
const { withSentry } = require("@sentry/react-native/expo");

const config = require("./app.json");

module.exports = withSentry(config. expo, {
  organization: "o4510741401436160",
  project: "daily-deals",
  // Only upload source maps in production builds
  uploadSourceMaps: process. env.EAS_BUILD_PROFILE === "production",
});