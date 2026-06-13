import { open } from '@tauri-apps/plugin-dialog'
import {
  MEDICAL_IMAGE_EXTENSIONS,
  isTauri,
  registerOpenedPath,
} from '../tauri-bridge'
import { loadFileFromPath } from './DesktopApp'

/**
 * Extract a basename from a path. Avoids an IPC round-trip just to ask Rust
 * for `Path::file_name()` - JS can split on the path separator itself, and
 * the dialog plugin returns absolute paths.
 */
function basename(path: string): string {
  return path.split(/[/\\]/).pop() ?? path
}

export const DesktopHomeScreen = () => {
  const handleOpenFile = async () => {
    if (!isTauri()) {
      return
    }
    const selected = await open({
      multiple: true,
      title: 'Open Medical Image',
      filters: [
        {
          name: 'Medical Images',
          extensions: MEDICAL_IMAGE_EXTENSIONS.map((ext) => ext.replace(/^\./, '')),
        },
        {
          name: 'All Files',
          extensions: ['*'],
        },
      ],
    })
    if (!selected) {
      return
    }
    const paths = Array.isArray(selected) ? selected : [selected]
    if (paths.length === 0) {
      return
    }
    // Authorise every user-confirmed path before any read attempt.
    await Promise.all(paths.map((p) => registerOpenedPath(p)))

    // Provision canvas slots once, before any addImage posts arrive.
    window.postMessage({
      type: 'initCanvas',
      body: { n: paths.length },
    })

    // Sequence the loads so the recent-files store doesn't race on read-
    // modify-write of its `recentFiles` key.
    for (const filePath of paths) {
      await loadFileFromPath(filePath, basename(filePath))
    }
  }

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 p-2 px-4">
        NiiVue Tauri
      </h2>
      <p className="w-full sm:w-96 mb-4 text-m font-normal text-gray-300 px-4">
        Open medical images from your local filesystem. Drag and drop files
        onto this window, or use the button below.
      </p>

      {isTauri() && (
        <button
          onClick={handleOpenFile}
          className="mx-4 mb-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Open File...
        </button>
      )}

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 py-2 px-4">
        Supported Formats
      </h2>
      <p className="w-full sm:w-96 mb-4 text-m font-normal text-gray-300 px-4">
        NIfTI (.nii, .nii.gz), DICOM (.dcm), MHA/MHD, NRRD, FreeSurfer (.mgh,
        .mgz), GIfTI (.gii), and many more.
      </p>

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 py-2 px-4">
        Data Privacy
      </h2>
      <p className="w-full sm:w-96 mb-4 text-m font-normal text-gray-300 px-4">
        All processing happens locally on your machine. No data is sent to any
        remote server. Your medical images never leave your computer.
      </p>
    </>
  )
}
