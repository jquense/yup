module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['../tsconfig.json'],
  },
  plugins: ['ts-expect'],
  rules: {
    'ts-expect/expect': 'error',
  },
};
