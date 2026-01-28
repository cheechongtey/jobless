/* eslint-disable @typescript-eslint/no-require-imports */
// Note: In this repo we run ESLint directly (see package.json "lint": "eslint").
// Some Next.js versions/configs don't support `next lint --fix`, so lint-staged
// uses `eslint --fix` for reliability.

const path = require('path');

// see: https://nextjs.org/docs/app/building-your-application/configuring/eslint#lint-staged
const buildEslintCommand = (filenames) =>
  `next lint --fix --file ${filenames
    // need to use __dirname instead of process.cwd() because lint-staged runs from the root of the repo
    .map((f) => path.relative(__dirname, f))
    .join(' --file ')}`;

module.exports = {
  '*.{js,jsx,ts,tsx}': [buildEslintCommand],
  '*.{js,jsx,ts,tsx,css,json,yaml}': 'prettier --write',
};
