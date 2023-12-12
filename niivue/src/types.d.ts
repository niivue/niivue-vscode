declare module '@niivue/niivue'
type VSCode = {
  postMessage(message: any): void
  getState(): any
  setState(state: any): void
}

declare const vscode: VSCode

// add a fake type for Niivue
declare class Niivue {
  [x: string]: any
}

declare module '*.png' {
  const value: any
  export = value
}