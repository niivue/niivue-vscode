type VSCode = {
  postMessage(message: any): void
  getState(): any
  setState(state: any): void
}

declare const vscode: VSCode

declare module '*.png' {
  const value: string
  export default value
}

declare module '*.jpg' {
  const value: string
  export default value
}

declare module '*.jpeg' {
  const value: string
  export default value
}

declare module '*.svg' {
  const value: string
  export default value
}

// JSX namespace for Preact
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any
  }
}
