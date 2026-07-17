/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Match the scope pattern already in use throughout the history:
    //   feat(backend): ...
    //   feat(operator-dashboard): ...
    //   chore: ...  (no scope also allowed)
    'scope-enum': [
      2,
      'always',
      ['backend', 'operator-dashboard', 'admin-dashboard', 'repo', 'ci', 'docs'],
    ],
    'scope-empty': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
