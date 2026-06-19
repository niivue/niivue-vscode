import { HomeSection } from '@niivue/react'
import imageUrl from '/resources/pwa_install.png'

export const HomeScreen = () => (
  <>
    <HomeSection title="Drop Files to load images">
      Drag and drop files to an empty space on this window. Many medical image and mesh formats are
      supported.
    </HomeSection>

    <HomeSection title="Install as local App">
      <img
        className="float-right ml-2 w-32 sm:w-40 h-auto"
        src={imageUrl}
        alt="Install button example"
      />
      To install niivue-vscode as a local app, click the install button in the address bar.
      <i> This is currently only supported in chromium-based browsers.</i>
    </HomeSection>

    <HomeSection title="Update App">
      The app will automatically check for updates and show a notification when a new version is
      available. You can also manually force an update by pressing{' '}
      <kbd className="bg-gray-600 px-1 rounded">Ctrl+Shift+R</kbd> to force refresh and clear the
      cache.
    </HomeSection>

    <HomeSection title="Bookmarklet">
      Drag this link ⇨
      <a
        className="touch-manipulation"
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
    </HomeSection>
  </>
)
