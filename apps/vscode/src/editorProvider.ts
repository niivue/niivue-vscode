import * as vscode from 'vscode'
import { NiiVueDocument } from './document'
import { getHtmlForWebview } from './html'

export class NiiVueEditorProvider implements vscode.CustomReadonlyEditorProvider<NiiVueDocument> {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      NiiVueEditorProvider.viewType,
      new NiiVueEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      },
    )
  }

  private static readonly viewType = 'niiVue.default'
  private readonly webviews = new WebviewCollection()

  constructor(private readonly _context: vscode.ExtensionContext) {}

  async openCustomDocument(uri: vscode.Uri): Promise<NiiVueDocument> {
    console.log(`Opening document ${uri}`)
    return new NiiVueDocument(uri)
  }

  private static async createPanel(
    context: vscode.ExtensionContext,
    viewType: string,
    tabName: string,
    uri: vscode.Uri,
  ) {
    const panel = vscode.window.createWebviewPanel(viewType, tabName, vscode.ViewColumn.One, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [
        context.extensionUri,
        vscode.Uri.joinPath(
          vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file('/'),
          '..',
        ),
      ],
    })
    panel.webview.html = await getHtmlForWebview(panel.webview, context.extensionUri)
    const editor = new NiiVueEditorProvider(context)
    editor.webviews.add(uri, panel)
    NiiVueEditorProvider.addCommonListeners(panel)
    return panel
  }

  private static postInitSettings(panel: vscode.WebviewPanel) {
    const config = vscode.workspace.getConfiguration('niivue')
    const showCrosshairs = config.get<boolean>('showCrosshairs', true)
    const interpolation = config.get<boolean>('interpolation', true)
    const colorbar = config.get<boolean>('colorbar', false)
    const radiologicalConvention = config.get<boolean>('radiologicalConvention', false)
    const zoomDragMode = config.get<boolean>('zoomDragMode', false)
    const defaultVolumeColormap = config.get<string>('defaultVolumeColormap', 'gray')
    const defaultOverlayColormap = config.get<string>('defaultOverlayColormap', 'redyell')
    const defaultOverlayOpacity = config.get<number>('defaultOverlayOpacity', 0.5)
    const defaultMeshOverlayColormap = config.get<string>('defaultMeshOverlayColormap', 'hsv')

    panel.webview.postMessage({
      type: 'initSettings',
      body: {
        showCrosshairs,
        interpolation,
        colorbar,
        radiologicalConvention,
        zoomDragMode,
        defaultVolumeColormap,
        defaultOverlayColormap,
        defaultOverlayOpacity,
        defaultMeshOverlayColormap,
      },
    })
  }

  public static async createOrShow(context: vscode.ExtensionContext, uri: vscode.Uri) {
    const name = vscode.Uri.parse(uri.toString()).path.split('/').pop()
    const tabName = name ? `web: ${name}` : 'NiiVue Web Panel'
    this.createPanel(context, 'niivue.webview', tabName, uri).then((panel) => {
      let isImageSent = false
      panel.webview.onDidReceiveMessage(async (e) => {
        if (e.type === 'ready' && !isImageSent) {
          isImageSent = true
          this.postInitSettings(panel)
          await NiiVueEditorProvider.sendInitialImage(uri, panel.webview)
        }
      })
    })
  }

  public static async createOrShowDcmFolder(context: vscode.ExtensionContext, uri: vscode.Uri) {
    const name = vscode.Uri.parse(uri.toString()).path.split('/').pop()
    const tabName = name ? name : 'NiiVue DICOM'
    this.createPanel(context, 'niivue.webview', tabName, uri).then((panel) => {
      let isImageSent = false
      panel.webview.onDidReceiveMessage(async (e) => {
        if (e.type === 'ready' && !isImageSent) {
          isImageSent = true
          this.postInitSettings(panel)
          NiiVueEditorProvider.openDcmFolder(uri, panel)
        }
      })
    })
  }

  public static async createCompareView(context: vscode.ExtensionContext, items: any) {
    const uris = items.map((item: any) => vscode.Uri.parse(item))
    this.createPanel(context, 'niivue.compare', 'NiiVue Compare Panel', uris[0]).then((panel) => {
      let isImageSent = false
      panel.webview.onDidReceiveMessage(async (e) => {
        if (e.type === 'ready' && !isImageSent) {
          isImageSent = true
          this.postInitSettings(panel)
          panel.webview.postMessage({
            type: 'initCanvas',
            body: { n: uris.length },
          })
          for (const uri of uris) {
            const body = await NiiVueEditorProvider.uriToImageBody(uri, panel.webview)
            panel.webview.postMessage({ type: 'addImage', body })
          }
        }
      })
    })
  }

  private static addCommonListeners(panel: vscode.WebviewPanel) {
    panel.webview.onDidReceiveMessage(async (e) => {
      switch (e.type) {
        case 'addOverlay':
          vscode.window
            .showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: false,
              canSelectMany: false,
              openLabel: 'Open Overlay',
              // filters: fileTypes // doesn't work properly in remote
            })
            .then(async (uris) => {
              if (uris && uris.length > 0) {
                const body = await NiiVueEditorProvider.uriToImageBody(uris[0], panel.webview)
                panel.webview.postMessage({
                  type: e.body.type,
                  body: { ...body, index: e.body.index },
                })
              }
            })
          return
        case 'addImages':
          vscode.window
            .showOpenDialog({
              canSelectFiles: true,
              canSelectFolders: false,
              canSelectMany: true,
              openLabel: 'Open Images',
              // filters: fileTypes
            })
            .then(async (uris) => {
              if (uris) {
                panel.webview.postMessage({
                  type: 'initCanvas',
                  body: { n: uris.length },
                })
                for (const uri of uris) {
                  if (uri.path.toLowerCase().endsWith('.mhd')) {
                    // MHD needs paired .raw resolution; handled separately.
                    await NiiVueEditorProvider.sendMhdMessage(uri, panel.webview)
                  } else {
                    const body = await NiiVueEditorProvider.uriToImageBody(uri, panel.webview)
                    panel.webview.postMessage({ type: 'addImage', body })
                  }
                }
              }
            })
          return
        case 'addDcmFolder':
          vscode.window
            .showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Open DICOM Folder',
            })
            .then(async (folderUri) => {
              if (folderUri) {
                NiiVueEditorProvider.openDcmFolder(folderUri[0], panel)
              }
            })
          return
      }
    })
  }

  public static async openDcmFolder(folderUri: vscode.Uri, panel: vscode.WebviewPanel) {
    const series = await NiiVueEditorProvider.collectDicomFolder(folderUri)
    if (series.uris.length > 0) {
      panel.webview.postMessage({
        type: 'addImage',
        body: { uri: series.uris, data: series.datas },
      })
      return
    }
    // Fallback: nothing sniffed as DICOM (e.g. files that lack the Part 10
    // preamble). Send every file in the folder and let the loader decide.
    const files = await vscode.workspace.fs.readDirectory(folderUri)
    const fileUris = files
      .filter(([, fileType]) => (fileType & vscode.FileType.File) !== 0)
      .map(([name]) => vscode.Uri.joinPath(folderUri, name))
    const data = await Promise.all(
      fileUris.map((uri) =>
        vscode.workspace.fs.readFile(uri).then((d) => NiiVueEditorProvider.toArrayBuffer(d)),
      ),
    )
    panel.webview.postMessage({
      type: 'addImage',
      body: {
        data,
        uri: fileUris.map((u) => u.toString()),
      },
    })
  }

  async resolveCustomEditor(
    document: NiiVueDocument,
    webviewPanel: vscode.WebviewPanel,
  ): Promise<void> {
    this.webviews.add(document.uri, webviewPanel)
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._context.extensionUri,
        vscode.Uri.joinPath(
          vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file('/'),
          '..',
        ),
      ],
    }
    webviewPanel.webview.html = await getHtmlForWebview(
      webviewPanel.webview,
      this._context.extensionUri,
    )

    NiiVueEditorProvider.addCommonListeners(webviewPanel)

    webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'ready') {
        NiiVueEditorProvider.postInitSettings(webviewPanel)
        await NiiVueEditorProvider.sendInitialImage(document.uri, webviewPanel.webview)
      }
    })
  }

  /**
   * Extensions the webview can route on its own (mirrors the customEditors
   * selector in package.json plus formats handled by dedicated code paths).
   * Files matching none of these get content-sniffed for DICOM, since DICOM
   * exports often have no extension or a bare UID as the file name.
   */
  private static readonly knownExtensions = [
    '.dcm',
    '.ima',
    '.nii',
    '.nii.gz',
    '.mih',
    '.mif',
    '.mif.gz',
    '.nhdr',
    '.nrrd',
    '.mhd',
    '.mha',
    '.mgh',
    '.mgz',
    '.v',
    '.v16',
    '.vmr',
    '.mz3',
    '.gii',
    '.mnc',
    '.mnc.gz',
    '.npy',
    '.npz',
    '.raw',
  ]

  static hasKnownExtension(lowerCasePath: string): boolean {
    return NiiVueEditorProvider.knownExtensions.some((ext) => lowerCasePath.endsWith(ext))
  }

  /** DICOM Part 10 magic: a 128-byte preamble followed by "DICM". */
  static isDicomData(data: Uint8Array): boolean {
    return (
      data.byteLength >= 132 &&
      data[128] === 0x44 && // D
      data[129] === 0x49 && // I
      data[130] === 0x43 && // C
      data[131] === 0x4d // M
    )
  }

  /**
   * Build the message body for an `addImage`/overlay payload.  Prefers a
   * webview URI (so NiiVue can stream large volumes) but falls back to reading
   * the file as binary when the URI is not reachable via the webview resource
   * proxy — i.e. remote workspaces where the file sits outside
   * `localResourceRoots`, or formats that NiiVue can only ingest as bytes
   * (`.dcm`, `.mnc`).
   *
   * Files without a recognized extension are read and sniffed for the DICOM
   * magic bytes; matches are shipped as binary so the webview routes them
   * through the DICOM loader.
   *
   * MHD files are handled separately by `sendMhdMessage` because they need
   * the paired `.raw` voxel file resolved alongside the header.
   */
  static async uriToImageBody(
    uri: vscode.Uri,
    webview: vscode.Webview,
  ): Promise<{ uri: string; data?: ArrayBuffer }> {
    const lowerCasePath = uri.path.toLowerCase()
    if (
      lowerCasePath.endsWith('.dcm') ||
      lowerCasePath.endsWith('.mnc') ||
      !NiiVueEditorProvider.isUriAccessible(uri)
    ) {
      const data = await vscode.workspace.fs.readFile(uri)
      return {
        data: NiiVueEditorProvider.toArrayBuffer(data),
        uri: uri.toString(),
      }
    }
    if (!NiiVueEditorProvider.hasKnownExtension(lowerCasePath)) {
      const data = await vscode.workspace.fs.readFile(uri)
      if (NiiVueEditorProvider.isDicomData(data)) {
        return {
          data: NiiVueEditorProvider.toArrayBuffer(data),
          uri: uri.toString(),
        }
      }
    }
    return { uri: webview.asWebviewUri(uri).toString() }
  }

  /**
   * Send the initial image(s) for a freshly opened panel.
   *
   * - MHD resolves its detached `.raw` voxel file.
   * - A DICOM file (recognized by extension or by sniffing the file's
   *   content) expands to every DICOM file in the same folder, so a single
   *   clicked slice loads its whole series. dcm2niix groups the slices and
   *   splits a multi-series folder into one volume per series.
   * - Everything else loads as a single image.
   */
  static async sendInitialImage(uri: vscode.Uri, webview: vscode.Webview): Promise<void> {
    if (uri.path.toLowerCase().endsWith('.mhd')) {
      await NiiVueEditorProvider.sendMhdMessage(uri, webview)
      return
    }
    const name = uri.path.split('/').pop() ?? ''
    if (NiiVueEditorProvider.isDicomCandidateName(name)) {
      try {
        const series = await NiiVueEditorProvider.collectDicomFolderImages(uri)
        if (series) {
          webview.postMessage({
            type: 'addImage',
            body: { uri: series.uris, data: series.datas },
          })
          return
        }
      } catch {
        // Fall through to a single-file load if directory scanning fails.
      }
    }
    const body = await NiiVueEditorProvider.uriToImageBody(uri, webview)
    webview.postMessage({ type: 'addImage', body })
  }

  /**
   * Cheap name-based pre-filter for DICOM files, used to avoid reading every
   * sibling in a directory. Matches `.dcm`/`.ima`, extension-less names
   * (`IM_0001`), and DICOM UID-style names (digits and dots). Actual content
   * is still verified with `isDicomData` before a file is treated as DICOM.
   */
  static isDicomCandidateName(name: string): boolean {
    const base = (name.split('/').pop() ?? name).toLowerCase()
    if (base.endsWith('.dcm') || base.endsWith('.ima')) {
      return true
    }
    return !base.includes('.') || /^[\d.]+$/.test(base)
  }

  /** The parent directory of a file URI. */
  private static parentDir(uri: vscode.Uri): vscode.Uri {
    const slashIndex = uri.path.lastIndexOf('/')
    const parentPath = slashIndex >= 0 ? uri.path.substring(0, slashIndex) : ''
    return uri.with({ path: parentPath || '/' })
  }

  /**
   * Read every DICOM file in a directory (name pre-filtered, content
   * verified) and return their URIs and bytes, sorted by URI for a stable
   * slice order.
   */
  static async collectDicomFolder(
    dirUri: vscode.Uri,
  ): Promise<{ uris: string[]; datas: ArrayBuffer[] }> {
    let entries: [string, vscode.FileType][]
    try {
      entries = await vscode.workspace.fs.readDirectory(dirUri)
    } catch {
      return { uris: [], datas: [] }
    }
    const collected: { uri: string; data: ArrayBuffer }[] = []
    for (const [name, fileType] of entries) {
      if ((fileType & vscode.FileType.File) === 0) {
        continue
      }
      if (!NiiVueEditorProvider.isDicomCandidateName(name)) {
        continue
      }
      const fileUri = vscode.Uri.joinPath(dirUri, name)
      let bytes: Uint8Array
      try {
        bytes = await vscode.workspace.fs.readFile(fileUri)
      } catch {
        continue
      }
      if (!NiiVueEditorProvider.isDicomData(bytes)) {
        continue
      }
      collected.push({ uri: fileUri.toString(), data: NiiVueEditorProvider.toArrayBuffer(bytes) })
    }
    collected.sort((a, b) => (a.uri < b.uri ? -1 : a.uri > b.uri ? 1 : 0))
    return { uris: collected.map((c) => c.uri), datas: collected.map((c) => c.data) }
  }

  /**
   * If `fileUri` is a DICOM file, return every DICOM file in its directory so
   * the whole series loads together. Returns null when the file is not DICOM,
   * so the caller falls back to a single-file load.
   */
  static async collectDicomFolderImages(
    fileUri: vscode.Uri,
  ): Promise<{ uris: string[]; datas: ArrayBuffer[] } | null> {
    let clicked: Uint8Array
    try {
      clicked = await vscode.workspace.fs.readFile(fileUri)
    } catch {
      return null
    }
    if (!NiiVueEditorProvider.isDicomData(clicked)) {
      return null
    }
    const series = await NiiVueEditorProvider.collectDicomFolder(
      NiiVueEditorProvider.parentDir(fileUri),
    )
    if (series.uris.length === 0) {
      // Directory listing failed; load just the clicked file.
      return { uris: [fileUri.toString()], datas: [NiiVueEditorProvider.toArrayBuffer(clicked)] }
    }
    return series
  }

  /**
   * Whether `uri` can be served through the webview resource proxy.  Requires
   * the same scheme *and* authority as one of the workspace folders so that a
   * `file://` workspace never claims to host a `vscode-remote://` file (which
   * is what broke menu-driven Add Image / Add Overlay on SSH-remote sessions
   * in single-file mode).
   */
  static isUriAccessible(uri: vscode.Uri): boolean {
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (!workspaceFolders) {
      return false
    }
    for (const folder of workspaceFolders) {
      if (
        uri.scheme === folder.uri.scheme &&
        uri.authority === folder.uri.authority &&
        uri.path.startsWith(folder.uri.path)
      ) {
        return true
      }
    }
    return false
  }

  /**
   * Parse an MHD `ElementDataFile` header. Returns the raw reference string
   * (e.g. "sphere.raw") for detached MHDs, or null when the data is embedded
   * (`LOCAL` or the field is absent) — in which case the MHD loads on its own.
   */
  private static getMhdPairedRawRef(mhdText: string): string | null {
    const match = mhdText.match(/^ElementDataFile\s*=\s*(.+)$/im)
    if (!match) {
      return null
    }
    const raw = match[1].trim().replace(/^["']|["']$/g, '')
    if (!raw || raw.toUpperCase() === 'LOCAL') {
      return null
    }
    return raw
  }

  /**
   * Resolve a `getMhdPairedRawRef()` value to a sibling file URI next to the
   * MHD. Restricted to a single basename — rejects `.`/`..`, nested subdirs,
   * and absolute paths so an untrusted MHD cannot reach outside its directory.
   * Returns null if the reference is unsafe; matches the basename-only
   * behaviour of the PWA/Jupyter/Streamlit apps.
   */
  private static resolveMhdPairedRawUri(mhdUri: vscode.Uri, ref: string): vscode.Uri | null {
    const segments = ref.replace(/\\/g, '/').split('/').filter((s) => s.length > 0)
    if (segments.length !== 1) {
      return null
    }
    const basename = segments[0]
    if (basename === '.' || basename === '..') {
      return null
    }
    const slashIndex = mhdUri.path.lastIndexOf('/')
    const parentPath = slashIndex >= 0 ? mhdUri.path.substring(0, slashIndex) : ''
    const parentDir = mhdUri.with({ path: parentPath || '/' })
    return vscode.Uri.joinPath(parentDir, basename)
  }

  private static toArrayBuffer(data: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(data.byteLength)
    new Uint8Array(buffer).set(data)
    return buffer
  }

  /**
   * Read an MHD file, resolve its paired .raw file, and send an addImage
   * message to the webview with both parts.
   *
   * When the file is accessible via webview URI (local or SSH-remote workspace),
   * both the .mhd and .raw webview URIs are sent so NiiVue can fetch them
   * directly.  When the file is not accessible that way, both files are read
   * and sent as binary buffers.
   */
  static async sendMhdMessage(uri: vscode.Uri, webview: vscode.Webview): Promise<void> {
    const mhdData = await vscode.workspace.fs.readFile(uri)
    const mhdText = new TextDecoder().decode(mhdData)
    const rawRef = NiiVueEditorProvider.getMhdPairedRawRef(mhdText)
    const rawUri = rawRef ? NiiVueEditorProvider.resolveMhdPairedRawUri(uri, rawRef) : null

    if (NiiVueEditorProvider.isUriAccessible(uri)) {
      const mhdWebviewUri = webview.asWebviewUri(uri).toString()
      const body: Record<string, unknown> = { uri: mhdWebviewUri }
      if (rawRef) {
        if (rawUri) {
          body.urlImgData = webview.asWebviewUri(rawUri).toString()
        } else {
          body.loadError = NiiVueEditorProvider.unpairedMhdMessage(uri, rawRef)
        }
      }
      webview.postMessage({ type: 'addImage', body })
    } else {
      const body: Record<string, unknown> = {
        data: NiiVueEditorProvider.toArrayBuffer(mhdData),
        uri: uri.toString(),
      }
      if (rawRef) {
        if (rawUri) {
          try {
            const rawData = await vscode.workspace.fs.readFile(rawUri)
            body.pairedData = NiiVueEditorProvider.toArrayBuffer(rawData)
          } catch (error) {
            body.loadError =
              `Missing paired data file at ${rawUri.toString()}: ${
                error instanceof Error ? error.message : String(error)
              }. MHD is a detached format and requires its referenced voxel file.`
          }
        } else {
          body.loadError = NiiVueEditorProvider.unpairedMhdMessage(uri, rawRef)
        }
      }
      webview.postMessage({ type: 'addImage', body })
    }
  }

  private static unpairedMhdMessage(uri: vscode.Uri, rawRef: string): string {
    const basename = rawRef.replace(/\\/g, '/').split('/').pop() ?? rawRef
    return (
      `Missing paired data file "${basename}" referenced by ${uri.path}. ` +
      `MHD is a detached format and requires its referenced voxel file ` +
      `to be present next to the header.`
    )
  }
}

class WebviewCollection {
  private readonly _webviews = new Set<{
    readonly resource: string
    readonly webviewPanel: vscode.WebviewPanel
  }>()

  public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
    const key = uri.toString()
    for (const entry of Array.from(this._webviews)) {
      if (entry.resource === key) {
        yield entry.webviewPanel
      }
    }
  }

  public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    const entry = { resource: uri.toString(), webviewPanel }
    this._webviews.add(entry)

    webviewPanel.onDidDispose(() => {
      this._webviews.delete(entry)
    })
  }
}
