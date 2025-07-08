# NiiVue Streamlit Component

A powerful Streamlit component that integrates the [NiiVue](https://github.com/niivue/niivue) neuroimaging viewer for interactive NIFTI file visualization in web applications.

## 🧠 Features

- **Interactive 3D Brain Visualization**: Full NiiVue viewer with 3D rendering, crosshairs, and slicing
- **Multiple Integration Methods**: 
  - Simple HTML embedding (`app.py`)
  - Custom React component (`app_component.py`)
  - Feature-rich demo (`demo.py`)
- **Drag & Drop Upload**: Easy NIFTI file upload with support for `.nii` and `.nii.gz` formats
- **Real-time Interaction**: Message-passing interface for dynamic viewer control
- **Local Build Integration**: Uses the built NiiVue PWA for optimal performance

## 🚀 Quick Start

### Prerequisites

- Python 3.7+
- Node.js 16+
- npm

### Automated Setup

1. **Clone and setup** (run from the project root):
   ```bash
   # Linux/Mac
   cd niivue-streamlit
   ./setup.sh
   
   # Windows
   cd niivue-streamlit
   setup.bat
   ```

2. **Run the application**:
   ```bash
   streamlit run app_component.py
   ```

### Manual Setup

1. **Build the NiiVue PWA**:
   ```bash
   cd ../niivue
   npm install
   npm run build
   ```

2. **Install Python dependencies**:
   ```bash
   cd ../niivue-streamlit
   pip install -r requirements.txt
   ```

3. **Build the React component**:
   ```bash
   cd niivue_component/frontend
   npm install
   npm run build
   cd ../..
   ```

4. **Install the component package**:
   ```bash
   pip install -e .
   ```

5. **Validate setup**:
   ```bash
   python validate.py
   ```

## 📱 Available Applications

### 1. `app.py` - Simple Implementation
Basic Streamlit app with inline HTML integration:
```bash
streamlit run app.py
```

### 2. `app_component.py` - React Component
Advanced implementation using custom React component:
```bash
streamlit run app_component.py
```

### 3. `demo.py` - Feature Demo
Comprehensive demo with multiple tabs and advanced features:
```bash
streamlit run demo.py
```

## 🛠️ Development

### Component Architecture

```
niivue-streamlit/
├── app.py                     # Simple HTML integration
├── app_component.py           # React component integration
├── demo.py                    # Feature demonstration
├── niivue_component/          # Custom Streamlit component
│   ├── __init__.py           # Python component interface
│   └── frontend/             # React frontend
│       ├── src/
│       │   ├── NiiVueViewer.tsx
│       │   └── index.tsx
│       └── build/            # Built React app
└── requirements.txt
```

### Message Interface

The component implements the same message-passing system used in the VS Code extension:

```javascript
// Initialization
window.postMessage({
    type: 'initSettings',
    body: { show3Dcrosshair: true, backColor: [0.2, 0.2, 0.2, 1] }
}, '*');

// Load image data
window.postMessage({
    type: 'addImage',
    body: { data: arrayBuffer, uri: filename }
}, '*');
```

### Custom Component API

```python
from niivue_component import niivue_viewer

result = niivue_viewer(
    nifti_data=file_bytes,        # Raw NIFTI file data
    filename="brain.nii.gz",      # Display filename
    height=700,                   # Component height
    css_content=css_content,      # NiiVue CSS
    js_content=js_content,        # NiiVue JavaScript
    key="unique_key"              # Streamlit component key
)
```

## 🔧 Troubleshooting

### Common Issues

1. **Build files not found**: Run the NiiVue build first
   ```bash
   cd ../niivue && npm run build
   ```

2. **Component not loading**: Ensure React component is built
   ```bash
   cd niivue_component/frontend && npm run build
   ```

3. **Import errors**: Install the component package
   ```bash
   pip install -e .
   ```

### Validation

Run the validation script to check your setup:
```bash
python validate.py
```

Expected output:
```
🧠 NiiVue Streamlit Component Validation
===========================================
🔍 Checking NiiVue build files...
✅ NiiVue build files found at: /path/to/niivue/build
   - CSS: 2,234,567 bytes
   - JS: 8,901,234 bytes

🔍 Checking React component...
✅ React component built at: /path/to/frontend/build
   - Found 8 build files

🔍 Checking Python dependencies...
✅ Streamlit installed: 1.28.0
✅ niivue_component module importable
✅ Build files readable: CSS(2,234,567), JS(8,901,234)

===========================================
✅ All required components are ready!

🚀 You can now run:
   streamlit run app_component.py
   streamlit run demo.py
```

## 📄 File Format Support

- `.nii` - Uncompressed NIFTI files
- `.nii.gz` - Gzip-compressed NIFTI files
- DICOM support via NiiVue's built-in capabilities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `python validate.py`
5. Submit a pull request

## 📚 Documentation

- [NiiVue Documentation](https://niivue.github.io/niivue/)
- [Streamlit Components](https://docs.streamlit.io/library/components)
- [React Component Development](https://reactjs.org/docs/getting-started.html)

## 📄 License

This project is licensed under the same terms as NiiVue. See the main project LICENSE file for details.

---

**Powered by [Streamlit](https://streamlit.io) and [NiiVue](https://github.com/niivue/niivue)**
6. Viewer displays the loaded volume

## Architecture

The integration follows the same pattern as the JupyterLab extension in `viewer.ts`:

- **HTML Template**: Self-contained HTML with local script/CSS references
- **Message System**: Uses `window.postMessage` for communication
- **Event Handling**: Listens for `AppReady` event before sending data
- **Error Handling**: Graceful fallbacks and error reporting

## Development

To modify the viewer behavior, edit the message handlers in the HTML template or modify the niivue source code and rebuild.
