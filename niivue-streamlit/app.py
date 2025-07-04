import streamlit as st
import streamlit.components.v1 as components
import base64
import os
from pathlib import Path

# --- SETUP BUILD FILES ---
# Read the built niivue files directly into memory

# --- FUNCTION TO READ BUILD FILES ---
def read_build_files():
    """Read the CSS and JS files from the niivue build directory"""
    app_dir = Path(__file__).parent.absolute()
    
    # Try multiple possible locations for the niivue build directory
    possible_build_dirs = [
        app_dir.parent / "niivue" / "build",  # When running from parent dir
        app_dir / ".." / "niivue" / "build",  # Alternative parent reference
        Path.cwd() / "niivue" / "build",      # When running from root
    ]
    
    css_content = ""
    js_content = ""
    
    for build_dir in possible_build_dirs:
        if build_dir.exists():
            css_file = build_dir / "assets" / "index.css"
            js_file = build_dir / "assets" / "index.js"
            
            if css_file.exists() and js_file.exists():
                try:
                    with open(css_file, 'r', encoding='utf-8') as f:
                        css_content = f.read()
                    with open(js_file, 'r', encoding='utf-8') as f:
                        js_content = f.read()
                    return css_content, js_content
                except Exception as e:
                    print(f"Error reading build files: {e}")
                    continue
    
    return css_content, js_content

# Read the build files at startup
CSS_CONTENT, JS_CONTENT = read_build_files()

# --- HTML AND JAVASCRIPT FOR THE NIIVUE COMPONENT ---
# This is a self-contained HTML file that includes the niivue build inline
# and implements the message interface for better integration.
html_template = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NiiVue Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #1a1a1a;
            color: #fff;
            font-family: Arial, sans-serif;
        }
        #app {
            width: 100vw;
            height: 100vh;
            display: block;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: white;
        }
        .error {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: #ff6b6b;
        }
        
        /* Inline CSS from build */
        __CSS_CONTENT__
    </style>
</head>
<body class="text-white p-0">
    <div id="app" class="w-screen h-screen">
        <div class="loading">Loading NIfTI viewer...</div>
    </div>

    <!-- This script tag will hold the base64 encoded NIFTI data -->
    <script id="nifti-data" type="application/json">
        {
            "data_base64": "__NIFTI_DATA_BASE64__",
            "filename": "__FILENAME__"
        }
    </script>

    <script>
        // Mock vscode API for Streamlit environment (similar to Jupyter integration)
        window.vscode = {
            postMessage: function(message) {
                console.log('NiiVue message:', message);
                // Forward the message to window.postMessage so our listeners can receive it
                window.postMessage(message, '*');
            }
        };

        // Listen for messages from the niivue app
        window.addEventListener('message', function(e) {
            const { type, body } = e.data;
            console.log('Received message:', type, body);
            
            // Handle debug messages and other communications
            if (type === 'debugAnswer') {
                console.log('Debug answer:', body);
            }
            
            // Handle ready message from NiiVue app
            if (type === 'ready') {
                console.log('NiiVue app is ready, initializing data...');
                initializeNiiVue();
            }
        });

        /**
         * Initialize and load NIFTI data when the app is ready
         */
        function initializeNiiVue() {
            const dataElement = document.getElementById('nifti-data');
            if (!dataElement) {
                console.error("Data element not found.");
                return;
            }

            const niftiJson = JSON.parse(dataElement.textContent);
            const base64Data = niftiJson.data_base64;
            const filename = niftiJson.filename;
            
            console.log("Loading data:", {
                hasBase64Data: !!base64Data,
                filename: filename,
                dataLength: base64Data ? base64Data.length : 0
            });

            // Send initialization message to the app
            window.postMessage({
                type: 'initSettings',
                body: {
                    show3Dcrosshair: true,
                    backColor: [0.2, 0.2, 0.2, 1],
                    textHeight: 0.05
                }
            }, '*');

            // If we have valid data, load it
            const hasValidData = base64Data && base64Data.length > 1000;
            
            if (hasValidData) {
                console.log(`Processing file: ${filename}, data length: ${base64Data.length}`);
                
                // Decode base64 to ArrayBuffer
                try {
                    const binary_string = window.atob(base64Data);
                    const len = binary_string.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                        bytes[i] = binary_string.charCodeAt(i);
                    }
                    const niftiArrayBuffer = bytes.buffer;
                    
                    console.log(`Decoded ArrayBuffer size: ${niftiArrayBuffer.byteLength} bytes`);

                    // Initialize canvas for one image
                    window.postMessage({
                        type: 'initCanvas',
                        body: 1
                    }, '*');

                    // Send the image data
                    window.postMessage({
                        type: 'addImage',
                        body: {
                            data: niftiArrayBuffer,
                            uri: filename,
                        }
                    }, '*');
                    
                } catch (error) {
                    console.error("Error processing file data:", error);
                }
            }
        }

        // Wait for DOM to be ready, then send initial ready message
        document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM loaded, waiting for NiiVue app to be ready...');
        });
    </script>

    <!-- Inline JS from build -->
    <script type="module">
        __JS_CONTENT__
    </script>
</body>
</html>
"""

# --- STREAMLIT APPLICATION ---

st.set_page_config(layout="wide", page_title="NIFTI Viewer")

st.title("🧠 Interactive NIFTI File Viewer")
st.markdown("Upload a `.nii` or `.nii.gz` file to visualize it with the integrated NiiVue viewer.")

# Check if static files are ready
FILES_READY = bool(CSS_CONTENT and JS_CONTENT)

if not FILES_READY:
    st.error("⚠️ NiiVue build files not found. Please run `npm run build` in the niivue directory first.")
    st.stop()

# --- SIDEBAR FOR FILE UPLOAD AND OPTIONS ---
with st.sidebar:
    st.header("Upload & Options")
    uploaded_file = st.file_uploader(
        "Choose a NIFTI file",
        type=["nii", "nii.gz"],
        help="You can upload NIFTI files in .nii or compressed .nii.gz format."
    )

# --- MAIN PANEL FOR THE VIEWER ---
if uploaded_file is not None:
    # 1. Read the uploaded file as bytes
    file_bytes = uploaded_file.getvalue()

    # 2. Encode the bytes to Base64
    file_base64 = base64.b64encode(file_bytes).decode()

    # 3. Get the filename
    filename = uploaded_file.name

    # 4. Replace placeholders in the HTML template
    html_content = html_template.replace("__NIFTI_DATA_BASE64__", file_base64)
    html_content = html_content.replace("__FILENAME__", filename)
    html_content = html_content.replace("__CSS_CONTENT__", CSS_CONTENT)
    html_content = html_content.replace("__JS_CONTENT__", JS_CONTENT)
    
    # Debug information in sidebar
    with st.sidebar:
        st.subheader("File Information")
        st.write(f"**Filename:** {filename}")
        st.write(f"**File size:** {len(file_bytes):,} bytes")
        st.write(f"**Base64 length:** {len(file_base64):,} characters")
        st.write(f"**Build files:** {'✅ Ready' if FILES_READY else '❌ Missing'}")

    # 5. Display the component
    with st.spinner(f"Loading {filename}..."):
        components.html(html_content, height=700, scrolling=False)

else:
    # Display the viewer with the default "upload a file" message
    html_content = html_template.replace("__NIFTI_DATA_BASE64__", "")
    html_content = html_content.replace("__FILENAME__", "")
    html_content = html_content.replace("__CSS_CONTENT__", CSS_CONTENT)
    html_content = html_content.replace("__JS_CONTENT__", JS_CONTENT)
    components.html(html_content, height=700, scrolling=False)

st.markdown(
    """
    <hr>
    <p style='text-align: center;'>
        Powered by <a href="https://streamlit.io" target="_blank">Streamlit</a> and
        <a href="https://github.com/niivue/niivue" target="_blank">NiiVue</a> 
        (integrated from local build).
    </p>
    """,
    unsafe_allow_html=True
)
