import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "build/**",
      "coverage/**",
      "node_modules/**",
      "src/components/Editor/ckeditor5/**",
      "src/icons/**",
      "*.config.{js,ts}",
      "config/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  reactHooks.configs["recommended-latest"],

  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.vitest,
        JSX: "readonly",
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // TypeScript already checks prop types and undefined names.
      "react/prop-types": "off",
      "no-undef": "off",
      // Pre-existing codebase style, out of scope for a dependency refresh:
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",       // ~35 existing @ts-ignore
      "@typescript-eslint/no-unused-expressions": "off", // `cond && fn()` used as a statement
      // `React` stays in the ignore list: the new JSX transform makes most
      // `import React from "react"` lines technically unused but harmless.
      // ignoreRestSiblings: the "destructure a few keys out so `...rest` omits them" pattern.
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^(_|React$)",
        ignoreRestSiblings: true,
      }],
      "no-unused-vars": "off",
      "no-prototype-builtins": "off",
      "react/display-name": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  {
    files: ["src/**/*.{js,jsx}"],
    rules: {
      // Plain JS files aren't type-checked; don't demand TS-only hygiene there.
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
