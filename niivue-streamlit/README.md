# NiiVue Streamlit Integration

This is an enhanced Streamlit app that integrates the NiiVue viewer using the local niivue subfolder project, similar to the JupyterLab integration.

## Features

- **Local NiiVue Build**: Uses the built files from the `../niivue` project instead of CDN
- **Message Interface**: Implements the same message-passing interface used in the VS Code extension
- **Enhanced Integration**: Better control over viewer initialization and data loading
- **Auto-Setup**: Automatically copies built files to static directory

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

   Or use the build script:
   ```bash
   ./build.sh
   streamlit run app.py
   ```

## How it Works

### Static File Management
- The app automatically copies built files from `../niivue/build/` to `./static/niivue/`
- Uses local CSS and JS files instead of CDN for better control and consistency

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

## Differences from Original

- **Local Build**: Uses `../niivue/build/` instead of CDN
- **Message Interface**: Uses NiiVue's native message system
- **Better Integration**: More consistent with other platform integrations
- **Enhanced UI**: Cleaner interface with better error handling

## Development

To modify the viewer behavior, edit the message handlers in the HTML template or modify the niivue source code and rebuild.
