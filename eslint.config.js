// ESLint (flat config). `npm run lint` desde la raíz revisa api, web y tools.
const js = require("@eslint/js");
const globals = require("globals");
const tseslint = require("typescript-eslint");
const reactHooks = require("eslint-plugin-react-hooks");

const sinUsar = ["error", { args: "none", caughtErrors: "none", varsIgnorePattern: "^_" }];

module.exports = tseslint.config(
  { ignores: ["**/node_modules/**", "web/dist/**", "docs/**", "db/**", "scratchpad/**", "**/*.tsbuildinfo", "tools/lib/**/*.py"] },

  // API, herramientas y pruebas: Node con CommonJS.
  {
    files: ["api/**/*.js", "tools/**/*.js", "web/test/**/*.cjs", "eslint.config.js"],
    extends: [js.configs.recommended],
    languageOptions: { sourceType: "commonjs", ecmaVersion: 2023, globals: { ...globals.node } },
    rules: { "no-unused-vars": sinUsar, "no-empty": ["error", { allowEmptyCatch: true }] },
  },
  // Los guiones de navegador (tools/e2e) ejecutan texto dentro de la página: usan globals del navegador solo como cadenas, no hace falta nada más.

  // Front: TypeScript + React.
  {
    files: ["web/src/**/*.{ts,tsx}", "web/*.ts"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: { "react-hooks": reactHooks },
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.browser } },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": sinUsar,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);
