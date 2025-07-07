# NiiVue Streamlit Integration (AI Copilot generated documentation)

This is a Streamlit app that integrates the NiiVue viewer using the local niivue subfolder project, similar to the JupyterLab and VS Code integration.

## Features

- **Local NiiVue Build**: Uses the built files from the `../niivue` PWA project with a GUI
- **Message Interface**: Implements the same message-passing interface used in the VS Code extension

## Setup

1. **Build the NiiVue project** (required first):

   ```bash
   cd ../niivue
   npm install
   npm run build
   ```

2. **Install Streamlit dependencies**:

   ```bash
   pip install -r requirements.txt
   ```

3. **Run the app**:

   ```bash
   streamlit run app.py
   ```

## How it Works

### Static File Management

- The app automatically copies built files from `../niivue/build/` to `./static/niivue/`

### Message Interface

- Implements the same message-passing system used in the VS Code extension
- Supports `initSettings`, `initCanvas`, and `addImage` messages
- Provides a mock `vscode` object for compatibility

### Data Flow

1. User uploads a NIFTI file
2. File is encoded to Base64
3. HTML template is populated with file data
4. NiiVue app receives initialization messages
5. Image data is passed via the message interface
6. Viewer displays the loaded volume

## Architecture

The integration follows the same pattern as the JupyterLab extension in `viewer.ts`:

- **HTML Template**: Self-contained HTML with local script/CSS references
- **Message System**: Uses `window.postMessage` for communication
- **Event Handling**: Listens for `AppReady` event before sending data
- **Error Handling**: Graceful fallbacks and error reporting

## Development

To modify the viewer behavior, edit the message handlers in the HTML template or modify the niivue source code and rebuild.
