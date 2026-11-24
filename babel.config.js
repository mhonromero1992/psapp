module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // "@/..." points at src/, the same alias the web version uses, so shared files copy as-is.
    ['module-resolver', {root: ['./src'], alias: {'@': './src'}, extensions: ['.ios.ts', '.android.ts', '.ts', '.tsx', '.js', '.json']}],
  ],
};
