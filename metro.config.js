const { getSentryExpoConfig } = require("@sentry/react-native/metro");
const { getDefaultConfig } = require("expo/metro-config");

const config = getSentryExpoConfig(
  __dirname,
  getDefaultConfig(__dirname)
);

// Asset support
config.resolver.assetExts.push("pdf");

// Transformer settings
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// Resolver fix
config.resolver = {
  ...config.resolver,
  resolverMainFields: ["react-native", "browser", "main"],
};

module.exports = config;
