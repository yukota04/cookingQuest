module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:prettier/recommended", // Ensures Prettier rules are applied
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "react-hooks", "jsx-a11y", "prettier"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        endOfLine: "lf",
        singleQuote: true,
        semi: true,
        tabWidth: 2,
        trailingComma: "es5",
        printWidth: 80,
      },
    ],
    "react/react-in-jsx-scope": "off", // Next.js doesn't require React to be in scope
    "react/prop-types": "off", // Disable prop-types validation
    "no-unused-vars": ["warn", { args: "none" }], // Warn for unused variables, ignore args
    "jsx-a11y/anchor-is-valid": "off", // Disable for Next.js Link component
    "react-hooks/exhaustive-deps": "warn", // Warn for missing dependencies in useEffect
  },
  settings: {
    react: {
      version: "detect", // Automatically detect the React version
    },
  },
};
