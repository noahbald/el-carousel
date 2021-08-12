module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    allowIndentationTabs: 0,
    'comma-dangle': [1, 'always-multiline'],
    semi: ['error', 'never'],
    'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
  },
};
