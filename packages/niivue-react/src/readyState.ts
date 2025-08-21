/**
 * Manages the ready state for VS Code integration
 * Only sends the ready message when both DOM and event listeners are ready
 */
// Type declaration for VS Code webview API
declare global {
  interface Window {
    vscode?: {
      postMessage(message: any): void
    }
  }
}

class ReadyStateManager {
  private eventListenerReady = false
  private domReady = false
  private readySent = false

  setEventListenerReady() {
    this.eventListenerReady = true
    this.checkAndSendReady()
  }

  setDomReady() {
    this.domReady = true
    this.checkAndSendReady()
  }

  private checkAndSendReady() {
    if (this.eventListenerReady && this.domReady && !this.readySent) {
      this.readySent = true
      
      if (window.vscode) {
        window.vscode.postMessage({ type: 'ready' })
      }
    }
  }
}
export const readyStateManager = new ReadyStateManager()
