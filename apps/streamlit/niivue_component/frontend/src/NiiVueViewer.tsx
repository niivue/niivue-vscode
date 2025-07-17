import React, { useEffect, useRef, useState } from "react"
import { Streamlit, withStreamlitConnection, ComponentProps } from "streamlit-component-lib"

interface Args {
  nifti_data: string
  filename: string
  height: number
  css_content: string
  js_content: string
}

const NiiVueViewer: React.FC<ComponentProps> = ({ args }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  const typedArgs = args as Args

  useEffect(() => {
    // Set component height
    Streamlit.setFrameHeight(typedArgs.height || 600)
  }, [typedArgs.height])

  useEffect(() => {
    if (!containerRef.current) return

    // Create the NiiVue viewer HTML structure
    const createNiiVueHTML = () => {
      const hasData = typedArgs.nifti_data && typedArgs.nifti_data.length > 0
      
      return `
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
                    width: 100%;
                    height: ${typedArgs.height || 600}px;
                    display: block;
                }
                .loading {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    color: white;
                }
                .error {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    height: 100%;
                    color: #ff6b6b;
                }
                
                /* Inline CSS from build */
                ${typedArgs.css_content || ''}
            </style>
        </head>
        <body class="text-white p-0">
            <div id="app" style="width: 100%; height: ${typedArgs.height || 600}px;">
                <div class="loading">${hasData ? `Loading ${typedArgs.filename}...` : 'Upload a NIFTI file to begin'}</div>
            </div>

            <!-- This script tag will hold the base64 encoded NIFTI data -->
            <script id="nifti-data" type="application/json">
                {
                    "data_base64": "${typedArgs.nifti_data || ''}",
                    "filename": "${typedArgs.filename || ''}"
                }
            </script>

            <script>
                // Mock vscode API for Streamlit environment
                window.vscode = {
                    postMessage: function(message) {
                        console.log('NiiVue message:', message);
                        window.postMessage(message, '*');
                    }
                };

                // Listen for messages from the niivue app
                window.addEventListener('message', function(e) {
                    const { type, body } = e.data;
                    console.log('Received message:', type, body);
                    
                    if (type === 'debugAnswer') {
                        console.log('Debug answer:', body);
                    }
                    
                    if (type === 'ready') {
                        console.log('NiiVue app is ready, initializing data...');
                        initializeNiiVue();
                    }
                });

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

                    const hasValidData = base64Data && base64Data.length > 1000;
                    
                    if (hasValidData) {
                        console.log(\`Processing file: \${filename}, data length: \${base64Data.length}\`);
                        
                        try {
                            const binary_string = window.atob(base64Data);
                            const len = binary_string.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binary_string.charCodeAt(i);
                            }
                            const niftiArrayBuffer = bytes.buffer;
                            
                            console.log(\`Decoded ArrayBuffer size: \${niftiArrayBuffer.byteLength} bytes\`);

                            window.postMessage({
                                type: 'initCanvas',
                                body: 1
                            }, '*');

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

                document.addEventListener('DOMContentLoaded', function() {
                    console.log('DOM loaded, waiting for NiiVue app to be ready...');
                });
            </script>

            <!-- Inline JS from build -->
            <script type="module">
                ${typedArgs.js_content || ''}
            </script>
        </body>
        </html>
      `
    }

    try {
      // Create iframe for the NiiVue content
      const iframe = document.createElement('iframe')
      iframe.style.width = '100%'
      iframe.style.height = `${typedArgs.height || 600}px`
      iframe.style.border = 'none'
      iframe.style.backgroundColor = '#1a1a1a'
      
      // Clear container and add iframe
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(iframe)
      
      // Write HTML content to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        iframeDoc.open()
        iframeDoc.write(createNiiVueHTML())
        iframeDoc.close()
      }
    } catch (err) {
      console.error('Error creating NiiVue viewer:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [typedArgs.nifti_data, typedArgs.filename, typedArgs.css_content, typedArgs.js_content, typedArgs.height])

  if (error) {
    return (
      <div style={{ 
        height: typedArgs.height || 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#ff6b6b',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div>
          <h3>Error loading NiiVue viewer</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: "100%", 
        height: `${typedArgs.height || 600}px`,
        backgroundColor: '#1a1a1a'
      }}
    />
  )
}

export default withStreamlitConnection(NiiVueViewer)
