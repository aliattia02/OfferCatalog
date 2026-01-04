const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add PDF to asset extensions (but don't bundle them)
config.resolver.assetExts = [...config.resolver.assetExts.filter(ext => ext !== 'pdf'), 'pdf'];

// Make sure source extensions are set
config.resolver.sourceExts = [...config.resolver.sourceExts];

// Suppress console warnings for development
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
  // Add this to help with asset processing
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

module.exports = config;