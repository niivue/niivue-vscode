import './AboutDialog.css'
import { type Signal, effect } from '@preact/signals'
import { useRef } from 'preact/hooks'
import { niivueLogo } from '../assets/niivue-logo'
import type { AppInfo } from './AppProps'

// Canonical source repo, used when a host doesn't supply its own `repoUrl`.
const DEFAULT_REPO_URL = 'https://github.com/niivue/niivue-vscode'

/**
 * The brand menu's "About" dialog: what niivue Viewer is, its credits, the data
 * privacy guarantee, and (when the host provides `appInfo`) the build version.
 *
 * `isOpen` is a trigger signal in the HeaderDialog mold: set it true to open the
 * native modal; the effect opens the dialog and immediately flips the signal
 * back to false so a later set reopens it. The dialog itself closes via its own
 * form button.
 */
export const AboutDialog = ({
  isOpen,
  appInfo,
}: {
  isOpen: Signal<boolean>
  appInfo?: AppInfo
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  effect(() => {
    if (isOpen.value) {
      dialogRef.current?.showModal()
      isOpen.value = false
    }
  })

  const repoUrl = appInfo?.repoUrl || DEFAULT_REPO_URL
  const version = appInfo?.version
  const built = appInfo?.buildDate ? new Date(appInfo.buildDate).toLocaleDateString() : ''
  // Link the version to its commit when we know the repo it was built from.
  const versionHref = version && appInfo?.repoUrl ? `${appInfo.repoUrl}/commit/${version}` : repoUrl

  return (
    <dialog ref={dialogRef} className="nv-about" data-testid="about-dialog">
      <form method="dialog" className="nv-about-body">
        <header className="nv-about-head">
          <img className="nv-brand-mark" src={niivueLogo} alt="" width={40} height={40} />
          <div>
            <h2 className="nv-about-title">niivue Viewer</h2>
            <p className="nv-about-tagline">Browser-based medical image &amp; mesh viewer</p>
          </div>
        </header>

        <p className="nv-about-text">
          An open-source viewer for NIfTI, DICOM, and mesh formats, built on{' '}
          <a
            className="nv-about-link"
            href="https://github.com/niivue/niivue/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NiiVue
          </a>
          . Initially developed at The University of Queensland by the Computational Imaging and{' '}
          <a
            className="nv-about-link"
            href="https://www.neurodesk.org/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NeuroDesk
          </a>{' '}
          group.
        </p>

        <p className="nv-about-text">
          Runs entirely on your machine. No image data is uploaded, sent, or stored remotely.
        </p>

        <div className="nv-about-links">
          <a className="nv-about-link" href={repoUrl} target="_blank" rel="noopener noreferrer">
            Source on GitHub
          </a>
        </div>

        {version && (
          <p className="nv-about-version" data-testid="about-version">
            <a
              className="nv-about-link"
              href={versionHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Version {version}
              {built ? ` · built ${built}` : ''}
            </a>
          </p>
        )}

        <button className="nv-about-close" value="close">
          Close
        </button>
      </form>
    </dialog>
  )
}
