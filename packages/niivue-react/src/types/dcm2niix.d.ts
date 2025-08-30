declare module '@niivue/dcm2niix' {
  export class Dcm2niix {
    worker?: Worker

    constructor()

    init(): Promise<boolean>

    convert(files: File[] | ArrayBuffer[]): Promise<{
      files: ArrayBuffer[]
      names: string[]
    }>
  }
}

declare module '@niivue/dcm2niix/worker.js?worker&inline' {
  const workerUrl: string
  export default workerUrl
}
