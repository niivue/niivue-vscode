// Stub for @niivue/dcm2niix in the MATLAB single-file build.
//
// niivue-react monkey-patches Dcm2niix.prototype.init at module load to
// spawn its worker from the inlined `dcm2niix-worker` virtual module.
// We replace the real @niivue/dcm2niix with this stub so vite's static
// analysis never sees `new Worker(new URL('./worker.js', import.meta.url))`
// and therefore does not emit a sibling worker chunk that MATLAB's uihtml
// cannot load.
//
// The Dcm2niix class shape (constructor + init + input + conformFileList)
// matches the real package's public surface, so the monkey-patch and any
// reachable consumer (dicomLoader) operate on a real prototype. Methods
// other than init never run in the MATLAB flow (MATLAB sends NIfTI bytes
// straight through, never DICOM), but we keep them callable for safety.
export class Dcm2niix {
  constructor() {
    this.worker = null
  }
  init() {
    return Promise.resolve(true)
  }
  conformFileList(fileObjectOrArray) {
    return Array.from(fileObjectOrArray).map((file) => ({
      file,
      webkitRelativePath: file.webkitRelativePath || file._webkitRelativePath || '',
    }))
  }
  input(fileListObject) {
    return new Processor({ worker: this.worker, fileList: this.conformFileList(fileListObject) })
  }
  inputFromWebkitDirectory(fileListObject) {
    return this.input(fileListObject)
  }
  inputFromDropItems(dataTransferItemArray) {
    return this.input(dataTransferItemArray)
  }
}

class Processor {
  constructor({ worker, fileList }) {
    this.worker = worker
    this.fileList = fileList
    this.commands = []
  }
  run() {
    return Promise.resolve([])
  }
}
