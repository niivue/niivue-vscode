// Type declarations for external modules without types

declare module '@niivue/dcm2niix' {
  export class Dcm2niix {
    worker?: Worker
    static prototype: Dcm2niix
    init(): void
  }
}

// Global type for VSCode API (used in niivue-react but not available in Streamlit context)
declare const vscode: {
  postMessage: (message: any) => void
} | undefined
