import type { AppProps } from '@niivue/react'
import { open } from '@tauri-apps/plugin-dialog'
import { isTauri, MEDICAL_IMAGE_EXTENSIONS, getFileInfo } from '../tauri-bridge'
import { loadFileFromPath } from './DesktopApp'

export const DesktopHomeScreen = ({ appProps }: { appProps: AppProps }) => {
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
    if (paths.length > 0) {
      window.postMessage({
        type: 'initCanvas',
        body: { n: paths.length },
      })
    }
    for (const filePath of paths) {
      const info = await getFileInfo(filePath)
      await loadFileFromPath(appProps, info.path, info.name)
    }
  }

  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-200 p-2 px-4">
        NiiVue Desktop
      </h2>
      <p className="w-full sm:w-96 mb-4 text-m font-normal text-gray-300 px-4">
        Open medical images from your local filesystem. Drag and drop files onto
        this window, or use the button below.
      </p>

      {isTauri() && (
        <button
          onClick={handleOpenFile}
          className="mx-4 mb-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
        >
          Open File…
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
