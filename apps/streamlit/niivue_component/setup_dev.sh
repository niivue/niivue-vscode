#!/bin/bash

# Development setup script for NiiVue Streamlit Component

echo "Setting up NiiVue Streamlit Component for development..."

# Check if we're in the right directory
if [ ! -f "frontend/package.json" ]; then
    echo "Error: Run this script from the niivue_component directory"
    exit 1
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -e .

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
cd frontend
npm install

# Build the frontend for production
echo "Building frontend for production..."
npm run build

cd ..

echo "Setup complete!"
echo ""
echo "To run in development mode:"
echo "1. Set _RELEASE = False in __init__.py"
echo "2. In one terminal: cd frontend && npm start"
echo "3. In another terminal: streamlit run ../app.py"
echo ""
echo "To run in production mode:"
echo "1. Set _RELEASE = True in __init__.py (default)"
echo "2. Run: streamlit run ../app.py"
