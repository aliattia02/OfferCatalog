const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add PDF to asset extensions (properly extend, don't replace)
config.resolver.assetExts = [... config.resolver.assetExts, 'pdf'];

// Don't override sourceExts - use defaults from expo/metro-config
// The default already includes:  ['js', 'jsx', 'json', 'ts', 'tsx', 'cjs', 'mjs']

// Suppress Jimp warnings by providing empty resolution for jimp modules
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('jimp')) {
    return {
      type: 'empty',
    };
  }
  // Otherwise, use the default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;