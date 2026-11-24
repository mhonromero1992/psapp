module.exports = {
  root: true,
  extends: '@react-native',
  // src/data and src/lib/{format,random}.ts are copied from webapp/ by `npm run sync:webapp`: the
  // web version's formatting is kept so the copies stay byte-identical.
  ignorePatterns: ['webapp/', 'android/', 'ios/', 'scripts/', 'src/data/', 'src/lib/format.ts', 'src/lib/random.ts'],
  overrides: [{files: ['jest.setup.js', '__tests__/**'], env: {jest: true}}],
};
