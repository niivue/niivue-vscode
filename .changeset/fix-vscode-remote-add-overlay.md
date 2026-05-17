---
"niivue": patch
---

Fix **Add Image** / **Add Overlay** silently failing on VS Code Remote-SSH (and any session where the picked file sits outside `localResourceRoots`). Centralise the URL-vs-binary decision in a new `uriToImageBody` helper used by every load entry point, harden `isUriAccessible` to match on scheme + authority + path (so a `file://` workspace can't claim to host a `vscode-remote://` file in single-file mode), and fall back to `vscode.workspace.fs.readFile` whenever `webview.asWebviewUri` can't serve the file.
