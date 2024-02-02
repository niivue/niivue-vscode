import { html } from 'htm/preact'
import imageUrl from '/resources/pwa_install.png'

export const HomeScreen = () => html`
  <h2 class="text-3xl font-bold text-gray-200 p-2">Drop Files to load images</h2>
  <p class="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
    Drag and drop files to an empty space on this window. Many medical image and mesh formats are
    supported.
  </p>
  <h2 class="text-3xl font-bold text-gray-200 p-2">Install as local App</h2>
  <p class="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
    <img class="float-right" src=${imageUrl} style="width:150px;height:90px;" />
    To install niivue-vscode as a local app, click the install button in the address bar.
    <i> This is currently only supported in chromium-based browsers.</i>
  </p>
  <h2 class="text-3xl font-bold text-gray-200 p-2">Bookmarklet</h2>
  <p class="w-96 mb-4 text-m font-normal text-gray-300 pl-2">
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
`
