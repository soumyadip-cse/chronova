module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    project: "./tsconfig.json",
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "prettier/prettier": "error",
    "react/no-unescaped-entities": "off",
  },
  settings: {
    react: {
      version: "18",
    },
    next: {
      rootDir: ".",
    },
  },
  ignorePatterns: ["drizzle.config.ts", "next.config.js", "vitest.config.ts", "vitest.setup.ts", "tailwind.config.ts", "postcss.config.js"],
}