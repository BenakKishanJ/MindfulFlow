// https://docs.expo.dev/guides/using-eslint/
// eslint.config.js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      'import/no-unresolved': ['error', { ignore: ['^@env$'] }],
    },
  },
]);

