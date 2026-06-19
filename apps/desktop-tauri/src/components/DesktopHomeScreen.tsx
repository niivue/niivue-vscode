import { HomeSection } from '@niivue/react'
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
      <HomeSection title="NiiVue Tauri">
        Open medical images from your local filesystem. Drag and drop files onto this window, or use
        the button below.
      </HomeSection>

      {isTauri() && (
        <button
          onClick={handleOpenFile}
          className="mx-4 mb-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Open File...
        </button>
      )}

      <HomeSection title="Supported Formats">
        NIfTI (.nii, .nii.gz), DICOM (.dcm), MHA/MHD, NRRD, FreeSurfer (.mgh, .mgz), GIfTI (.gii),
        and many more.
      </HomeSection>
    </>
  )
}
