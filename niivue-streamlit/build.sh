#!/bin/bash

# Build script for NiiVue Streamlit app
# This script builds the niivue project and copies files for Streamlit

echo "🔧 Building NiiVue project..."
cd ../niivue
npm install
npm run build

echo "📦 Build completed!"
echo "🚀 You can now run the Streamlit app with: streamlit run app.py"
