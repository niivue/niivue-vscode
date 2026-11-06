declare module '@niivue/dcm2niix' {
  // The subset of the dcm2niix API that src/dicom.ts uses.
  export class Dcm2niix {
    worker: Worker | null

    constructor()

    init(): Promise<boolean>

    input(files: File[]): { run(): Promise<File[]> }
  }
}
