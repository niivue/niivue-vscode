#!/bin/bash
set -e

echo "🚀 Setting up NiiVue development environment..."

# Install pnpm globally
echo "📦 Installing pnpm..."
npm install -g pnpm@latest

# Create and configure pnpm store
echo "⚙️ Configuring pnpm..."
mkdir -p /tmp/pnpm-store
pnpm config set store-dir /tmp/pnpm-store

# Install all dependencies
echo "📦 Installing project dependencies..."
pnpm install

# Install Python development dependencies for Jupyter
echo "🐍 Setting up Python environment for JupyterLab development..."
pip install --upgrade pip
pip install jupyterlab>=4.0.0 jupyter-packaging build hatch

# Install Jupyter extension in development mode
echo "🔧 Setting up JupyterLab extension..."
cd apps/jupyter
pip install -e .[test]

# Build the initial setup
echo "🏗️ Building initial packages..."
cd ../..
pnpm build

# Install JupyterLab extension in development mode
echo "🔌 Installing JupyterLab extension in development mode..."
cd apps/jupyter
jupyter labextension develop . --overwrite

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  - Start PWA dev server: pnpm dev:source"
echo "  - Start JupyterLab: jupyter lab"
echo "  - Build all packages: pnpm build"
echo "  - Run tests: pnpm test"
echo ""
echo "📁 Available applications:"
echo "  - PWA: http://localhost:3000"
echo "  - JupyterLab: http://localhost:8888"
