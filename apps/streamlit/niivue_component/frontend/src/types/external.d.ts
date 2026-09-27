// Type declarations for external modules without types

// Global type for VSCode API (used in niivue-react but not available in Streamlit context)
declare const vscode: {
  postMessage: (message: any) => void
} | undefined
