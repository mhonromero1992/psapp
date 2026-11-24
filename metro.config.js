const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The web version lives in webapp/ with its own node_modules; Metro never crawls it.
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    blockList: [/\/webapp\/.*/],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
