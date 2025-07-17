#!/bin/bash

# Build script for the NiiVue Streamlit Component
# This script builds the NiiVue assets and copies them to the component

set -e

echo "🔨 Building NiiVue Streamlit Component"

# Change to the script directory
cd "$(dirname "$0")"

# Check if we're in the right directory
if [ ! -d "niivue_component" ]; then
    echo "❌ Error: niivue_component directory not found"
    echo "Please run this script from the niivue-streamlit directory"
    exit 1
fi

# Step 1: Build NiiVue if the directory exists
if [ -d "../niivue" ]; then
    echo "📦 Building NiiVue..."
    cd ../niivue
    
    if [ ! -f "package.json" ]; then
        echo "❌ Error: ../niivue/package.json not found"
        exit 1
    fi
    
    npm install
    npm run build
    cd ../niivue-streamlit
    echo "✅ NiiVue build complete"
else
    echo "⚠️  Warning: ../niivue directory not found, skipping NiiVue build"
    echo "   Make sure NiiVue is built manually"
fi

# Step 2: Create assets directory in component
echo "📁 Creating assets directory..."
mkdir -p niivue_component/assets

# Step 3: Copy NiiVue assets
if [ -d "../niivue/build/assets" ]; then
    echo "📋 Copying NiiVue assets..."
    cp ../niivue/build/assets/index.css niivue_component/assets/
    cp ../niivue/build/assets/index.js niivue_component/assets/
    cp ../niivue/build/assets/*.wasm niivue_component/assets/ 2>/dev/null || true
    cp ../niivue/build/assets/worker*.js niivue_component/assets/ 2>/dev/null || true
    echo "✅ Assets copied successfully"
else
    echo "❌ Error: ../niivue/build/assets not found"
    echo "   Please build NiiVue first: cd ../niivue && npm run build"
    exit 1
fi

# Step 4: Build the React component
echo "⚛️  Building React component..."
cd niivue_component/frontend

if [ ! -f "package.json" ]; then
    echo "❌ Error: frontend/package.json not found"
    exit 1
fi

npm install
npm run build
cd ../..

# Step 5: Install the component in development mode
echo "🐍 Installing component in development mode..."
pip install -e .

echo ""
echo "🎉 Build complete!"
echo ""
echo "📋 Assets included (auto-generated, not in git):"
ls -la niivue_component/assets/
echo ""
echo "🚀 You can now:"
echo "   - Test with: streamlit run test_simplified_api.py"
echo "   - Run main app: streamlit run app_component.py"
echo "   - Build for PyPI: python setup.py sdist bdist_wheel"
