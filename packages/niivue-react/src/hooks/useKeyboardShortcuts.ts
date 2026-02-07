import { useEffect } from 'preact/hooks'
import { matchesShortcut, UI_SHORTCUTS } from '../constants/keyboardShortcuts'

export interface KeyboardShortcutHandlers {
  onViewAxial?: () => void
  onViewSagittal?: () => void
  onViewCoronal?: () => void
  onViewRender?: () => void
  onViewMultiplanar?: () => void
  onResetView?: () => void
  onToggleInterpolation?: () => void
  onToggleColorbar?: () => void
  onToggleRadiological?: () => void
  onToggleCrosshair?: () => void
  onToggleZoomMode?: () => void
  onAddImage?: () => void
  onAddOverlay?: () => void
  onColorscale?: () => void
  onHideUI?: () => void
  onShowHeader?: () => void
}

/**
 * Hook to handle keyboard shortcuts for NiiVue UI actions
 * Note: niivue.js core shortcuts (V, C, arrows, H/J/K/L, Ctrl+U/D) are handled by the niivue library itself
 *
 * @param handlers - Object containing callback functions for each shortcut action
 * @param enabled - Whether keyboard shortcuts are enabled (default: true)
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Check each shortcut and call the corresponding handler
      if (matchesShortcut(event, UI_SHORTCUTS.VIEW_AXIAL) && handlers.onViewAxial) {
        event.preventDefault()
        handlers.onViewAxial()
      } else if (matchesShortcut(event, UI_SHORTCUTS.VIEW_SAGITTAL) && handlers.onViewSagittal) {
        event.preventDefault()
        handlers.onViewSagittal()
      } else if (matchesShortcut(event, UI_SHORTCUTS.VIEW_CORONAL) && handlers.onViewCoronal) {
        event.preventDefault()
        handlers.onViewCoronal()
      } else if (matchesShortcut(event, UI_SHORTCUTS.VIEW_RENDER) && handlers.onViewRender) {
        event.preventDefault()
        handlers.onViewRender()
      } else if (
        matchesShortcut(event, UI_SHORTCUTS.VIEW_MULTIPLANAR) &&
        handlers.onViewMultiplanar
      ) {
        event.preventDefault()
        handlers.onViewMultiplanar()
      } else if (matchesShortcut(event, UI_SHORTCUTS.RESET_VIEW) && handlers.onResetView) {
        event.preventDefault()
        handlers.onResetView()
      } else if (
        matchesShortcut(event, UI_SHORTCUTS.TOGGLE_INTERPOLATION) &&
        handlers.onToggleInterpolation
      ) {
        event.preventDefault()
        handlers.onToggleInterpolation()
      } else if (
        matchesShortcut(event, UI_SHORTCUTS.TOGGLE_COLORBAR) &&
        handlers.onToggleColorbar
      ) {
        event.preventDefault()
        handlers.onToggleColorbar()
      } else if (
        matchesShortcut(event, UI_SHORTCUTS.TOGGLE_RADIOLOGICAL) &&
        handlers.onToggleRadiological
      ) {
        event.preventDefault()
        handlers.onToggleRadiological()
      } else if (
        matchesShortcut(event, UI_SHORTCUTS.TOGGLE_CROSSHAIR) &&
        handlers.onToggleCrosshair
      ) {
        event.preventDefault()
        handlers.onToggleCrosshair()
      } else if (
        matchesShortcut(event, UI_SHORTCUTS.TOGGLE_ZOOM_MODE) &&
        handlers.onToggleZoomMode
      ) {
        event.preventDefault()
        handlers.onToggleZoomMode()
      } else if (matchesShortcut(event, UI_SHORTCUTS.ADD_IMAGE) && handlers.onAddImage) {
        event.preventDefault()
        handlers.onAddImage()
      } else if (matchesShortcut(event, UI_SHORTCUTS.ADD_OVERLAY) && handlers.onAddOverlay) {
        event.preventDefault()
        handlers.onAddOverlay()
      } else if (matchesShortcut(event, UI_SHORTCUTS.COLORSCALE) && handlers.onColorscale) {
        event.preventDefault()
        handlers.onColorscale()
      } else if (matchesShortcut(event, UI_SHORTCUTS.HIDE_UI) && handlers.onHideUI) {
        event.preventDefault()
        handlers.onHideUI()
      } else if (matchesShortcut(event, UI_SHORTCUTS.SHOW_HEADER) && handlers.onShowHeader) {
        event.preventDefault()
        handlers.onShowHeader()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers, enabled])
}
