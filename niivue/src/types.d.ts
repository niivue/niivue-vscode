type VSCode = {
  postMessage(message: any): void
  getState(): any
  setState(state: any): void
}

declare const vscode: VSCode

declare module '*.png' {
  const value: any
  export = value
}
