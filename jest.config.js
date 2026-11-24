module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/webapp/'],
  modulePathIgnorePatterns: ['<rootDir>/webapp/'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|react-native-.*|phosphor-react-native|@react-native-async-storage)/)',
  ],
};
