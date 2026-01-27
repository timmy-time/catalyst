module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-refresh/recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', 'node_modules'],
  rules: {},
};
