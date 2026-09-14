module.exports = {
  preset: 'react-native',
  // The preset only transforms react-native packages; the safe-area mock
  // ships as TSX and must be transformed too.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-safe-area-context)/)',
  ],
  setupFiles: [
    '<rootDir>/node_modules/react-native-gesture-handler/jestSetup.js',
    '<rootDir>/jest.setup.js',
  ],
};
