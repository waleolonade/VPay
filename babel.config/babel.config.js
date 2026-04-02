/**
 * Babel Configuration
 * Configured for Expo + React Native (SDK 54)
 * 
 * Presets:
 * - babel-preset-expo: Handles Expo transformations
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    env: {
      production: {
        presets: ['babel-preset-expo'],
      },
    },
  };
};
