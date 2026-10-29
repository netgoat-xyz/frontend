import next from "eslint-config-next";

/**
 * React Compiler rules that eslint-config-next 16 enables as errors.
 *
 * These flag pre-existing patterns in this branch (mount gates, data-loading
 * effects, ref writes during render). Refactoring them changes runtime
 * behaviour, so they are reported as warnings until each component is
 * migrated. They must not block CI while the rewrite is in flight — see the
 * "Known lint debt" note in CONTRIBUTING.md.
 */
const reactCompilerDebtRules = {
  "react-hooks/set-state-in-effect": "warn",
  "react-hooks/refs": "warn",
  "react-hooks/purity": "warn",
  "react-hooks/immutability": "warn",
  "react-hooks/exhaustive-deps": "warn",
};

export default [
  ...next,
  {
    rules: reactCompilerDebtRules,
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];
