import { html } from 'htm/preact'
import { OpenFromWeb } from './OpenFromWeb'

export const HomeScreen = () => html`
  <h2 class="text-3xl font-bold text-gray-200 p-2">Bookmarklet</h2>
  <p class="w-96 text-lg text-gray-300 pl-2">
    Drag this link ⇨
    <a
      href="javascript: (() => {
            for (let link of document.links) {
              if (link.href.endsWith('.nii.gz') || link.href.endsWith('.nii')) {
                link.style.color = '#5599dd';
                link.href = 'https://korbinian90.github.io/niivue-vscode/?images=' + link.href;
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
  <h2 class="text-3xl font-bold text-gray-200 p-2">Drop Files to load images</h2>
  <p class="w-96 mb-4 text-lg font-normal text-gray-300 pl-2">
    Drag and drop files to an empty space on this window. Many medical image and mesh formats are
    supported.
  </p>
`
