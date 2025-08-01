#!/bin/bash
set -e

echo "🚀 Setting up NiiVue development environment..."

# Update npm to latest version (suppress funding messages)
echo "📦 Updating npm..."
npm install -g npm@latest --silent

# Install pnpm
echo "📦 Installing pnpm..."
npm install -g pnpm@latest --silent

# Configure pnpm for monorepo
echo "⚙️ Configuring pnpm..."
mkdir -p /tmp/pnpm-store
pnpm config set store-dir /tmp/pnpm-store
pnpm config set auto-install-peers true

# Install dependencies
echo "📦 Installing project dependencies..."
pnpm install --frozen-lockfile

# Setup Python environment for Jupyter
echo "🐍 Setting up Python environment..."
pip install --upgrade pip
pip install jupyterlab>=4.0.0 jupyter-packaging build hatch --quiet

# Install Jupyter extension in development mode
echo "🔧 Setting up JupyterLab extension..."
cd apps/jupyter
pip install -e .[test] --quiet

# Build packages
echo "🏗️ Building packages..."
cd ../..
pnpm build

# Install JupyterLab extension in development mode
echo "🔌 Installing JupyterLab extension..."
cd apps/jupyter
jupyter labextension develop . --overwrite
cd ../..

echo "✅ Setup complete!"
echo ""
echo "🚀 Quick start:"
echo "  pnpm dev             - Start development servers"
echo "  pnpm build           - Build all packages"
echo "  pnpm test            - Run tests"
echo ""
echo "📁 Applications:"
echo "  PWA:        http://localhost:3000"
echo "  JupyterLab: http://localhost:8888"
