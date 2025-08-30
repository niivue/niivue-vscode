import imageUrl from '/resources/pwa_install.png'

export const HomeScreen = () => (
  <>
    <h2 className="text-3xl font-bold text-gray-200 p-2">Drop Files to load images</h2>
    <p className="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
      Drag and drop files to an empty space on this window. Many medical image and mesh formats are
      supported.
    </p>

    <h2 className="text-3xl font-bold text-gray-200 p-2">Install as local App</h2>
    <p className="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
      <img className="float-right" src={imageUrl} style={{ width: '150px', height: '90px' }} />
      To install niivue-vscode as a local app, click the install button in the address bar.
      <i> This is currently only supported in chromium-based browsers.</i>
    </p>

    <h2 className="text-3xl font-bold text-gray-200 p-2">Update App</h2>
    <p className="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
      The app will automatically check for updates and show a notification when a new version is
      available. You can also manually force an update by pressing{' '}
      <kbd className="bg-gray-600 px-1 rounded">Ctrl+Shift+R</kbd> to force refresh and clear the
      cache.
    </p>

    <h2 className="text-3xl font-bold text-gray-200 p-2">Bookmarklet</h2>
    <p className="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
      Drag this link ⇨
      <a
        href="javascript: (() => {
              for (let link of document.links) {
                if (link.href.endsWith('.nii.gz') || link.href.endsWith('.nii')) {
                  link.style.color = '#5599dd';
                  link.href = 'https://niivue.github.io/niivue-vscode/?images=' + link.href;
                }
              }
            })();"
      >
        <b> Niivue-ify </b>
      </a>
      ⇦ to your bookmarks bar. When you click the bookmark, all links to NIfTI files on the current
      web page will be redirected to niivue-vscode web. Link to test:
      <a href="https://niivue.github.io/niivue-demo-images/mni152.nii.gz">
        <b> MNI </b>
      </a>
    </p>

    <h2 className="text-3xl font-bold text-gray-200 p-2">Data Privacy</h2>
    <p className="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
      The vscode extension (or static webpage) runs locally and only accesses the images from your
      machine for displaying. No data is sent or stored remotely. The extension is a complete
      offline solution and does not use any online cache, storage, or network connectivity. The
      extension does not track or log any user data. Local logging is minimal and only related to
      hardware events.
    </p>
    <p className="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
      The extension is an open source project depending on
      <a href="https://github.com/niivue/niivue/">
        <b> NiiVue</b>
      </a>{' '}
      and was initially developed at The University of Queensland by the Computational Imaging and
      <a href="https://www.neurodesk.org/">
        <b> NeuroDesk</b>
      </a>{' '}
      group.
    </p>
    <footer className="text-xs p-2">
      <a
        href={__GIT_REPO_URL__ ? `${__GIT_REPO_URL__}/commit/${__GIT_HASH__}` : '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-500 hover:underline"
      >
        Version: {__GIT_HASH__} (Built: {new Date(__BUILD_DATE__).toLocaleDateString()})
      </a>
    </footer>
  </>
)
