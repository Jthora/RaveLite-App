module.exports = {
  root: true,
  extends: '@react-native',
  overrides: [
    {
      // Test files and the Jest setup run under Jest's globals (`jest`,
      // `describe`, `it`, `expect`). Without this, `npm run lint` reports
      // 28 no-undef errors in files that are working perfectly — which is
      // how a lint script stops being run at all.
      files: ['**/__tests__/**', '**/*.test.{ts,tsx,js}', 'jest.setup.js'],
      env: {jest: true},
    },
  ],
};
