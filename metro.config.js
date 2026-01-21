// metro.config.js - Fixed for Windows ESM compatibility
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { getDefaultConfig } = require("expo/metro-config");

// Get the default Expo config first, then wrap with Sentry
const defaultConfig = getDefaultConfig(__dirname);
const config = getSentryExpoConfig(__dirname, defaultConfig);

// Asset support
config.resolver.assetExts.push("pdf");

// Transformer settings
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires:  true,
    },
  }),
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames:  true,
    },
  },
};

// Resolver fix
config.resolver = {
  ...config.resolver,
  resolverMainFields:  ["react-native", "browser", "main"],
};

module.exports = config;