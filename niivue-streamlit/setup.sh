#!/bin/bash

# NiiVue Streamlit Component Setup Script
# This script builds the niivue app and the React component, then installs the Python package

set -e  # Exit on any error

echo "🧠 NiiVue Streamlit Component Setup"
echo "======================================"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "niivue-streamlit" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build the NiiVue app
echo "📦 Step 1: Building NiiVue app..."
cd niivue || { echo "❌ Error: niivue directory not found"; exit 1; }

if [ ! -f "package.json" ]; then
    echo "❌ Error: niivue/package.json not found"
    exit 1
fi

echo "Installing NiiVue dependencies..."
npm install

echo "Building NiiVue app..."
npm run build

cd ..

# Step 2: Build the React component
echo "📦 Step 2: Building React component..."
cd niivue-streamlit/niivue_component/frontend || { echo "❌ Error: frontend directory not found"; exit 1; }

echo "Installing React component dependencies..."
npm install

echo "Building React component..."
npm run build

cd ../../..

# Step 3: Install the Python package
echo "🐍 Step 3: Installing Python package..."
cd niivue-streamlit

echo "Installing Streamlit component in development mode..."
pip install -e .

echo "✅ Setup complete!"
echo ""
echo "🚀 You can now run the Streamlit app:"
echo "   cd niivue-streamlit"
echo "   streamlit run app.py"
