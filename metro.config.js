const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { getDefaultConfig } = require("expo/metro-config");

const config = getSentryExpoConfig(__dirname, getDefaultConfig(__dirname));

// Add PDF support
config.resolver.assetExts.push('pdf');

// Ensure proper source extensions
config.resolver.sourceExts = [...config.resolver.sourceExts];

// ✅ CRITICAL FIX for __extends and Sentry issues
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // ✅ Add minifierConfig to handle tslib properly
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// ✅ Add resolver configuration for better module resolution
config.resolver = {
  ...config.resolver,
  resolverMainFields: ['react-native', 'browser', 'main'],
};

module.exports = config;