// One clock for every machine. Without this the suite runs in whatever
// zone the laptop is in and CI runs in UTC, so a test that depends on the
// local day passes in one place and fails in the other. Set TZ in the
// environment to run the suite somewhere else on purpose.
process.env.TZ = process.env.TZ || 'America/New_York';

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
