import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    ignores: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",

      // Code style rules (formatting-like)
      "no-console": ["warn", { "allow": ["warn", "error", "log"] }],
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],

      // Import organization
      "sort-imports": ["error", {
        "ignoreCase": false,
        "ignoreDeclarationSort": true,
        "ignoreMemberSort": false
      }]
    }
  },
  // More relaxed rules for VS Code extension development
  {
    files: ["apps/vscode/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // VS Code APIs often use any
      "no-console": "off", // Console logging is common in extensions for debugging
    }
  },
  // More relaxed rules for React components working with NiiVue
  {
    files: ["packages/niivue-react/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // NiiVue library heavily uses any types
      "@typescript-eslint/no-unused-vars": "off", // Allow unused vars for React component props
      "@typescript-eslint/no-unused-expressions": "off", // Allow for React patterns
      "@typescript-eslint/no-wrapper-object-types": "off", // Allow Boolean type for React props
      "eqeqeq": "off", // Allow loose equality for compatibility with NiiVue
      "curly": "off", // Allow single-line if statements for brevity
      "sort-imports": "off", // Allow flexible import ordering for React components
      "no-console": "off", // Allow console logging for debugging
    }
  },
  // More relaxed rules for PWA application
  {
    files: ["apps/pwa/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Working with NiiVue library
      "eqeqeq": "off", // Allow loose equality for compatibility with NiiVue
      "sort-imports": "off", // Allow flexible import ordering for React components
      "no-console": "off", // Allow console logging for debugging
    }
  }
];
