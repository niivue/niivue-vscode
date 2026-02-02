#!/bin/bash
set -e

echo "🚀 Setting up NiiVue development environment..."

# Configure git to trust the workspace directory
WORKSPACE_DIR="/workspaces/niivue-vscode"
if [ -d "$WORKSPACE_DIR" ]; then
    git config --global --add safe.directory "$WORKSPACE_DIR"
fi

# Install pnpm globally if not already present or needs update
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@latest
else
    echo "✅ pnpm is already installed."
fi

# Configure pnpm store to be persistent in the workspace
echo "⚙️ Configuring pnpm store..."
PNPM_STORE="$WORKSPACE_DIR/.pnpm-store"
mkdir -p "$PNPM_STORE"
pnpm config set store-dir "$PNPM_STORE"

# Install all dependencies
echo "📦 Installing project dependencies..."
# We use || to handle cases where the user aborts a node_modules removal (Exit Code 1)
# --prefer-offline helps reusing the .pnpm-store effectively
pnpm install --prefer-offline || {
    RET=$?
    if [ $RET -eq 1 ]; then
        echo "⚠️ pnpm install was aborted (probably declined node_modules removal)."
        echo "   Continuing with current node_modules state..."
    else
        echo "❌ pnpm install failed with exit code $RET."
        exit $RET
    fi
}

# Install Playwright browsers and dependencies
echo "🎭 Installing Playwright browsers..."
pnpm --filter @niivue/pwa exec playwright install --with-deps

# Install Python development dependencies for Jupyter
echo "🐍 Setting up Python environment..."
pip install --upgrade pip
pip install jupyterlab>=4.0.0 jupyter-packaging build hatch twine
pip install coverage pytest pytest-asyncio pytest-cov pytest-jupyter pytest-xvfb

# Ensure local bin is in PATH for jupyter and persist it
LOCAL_BIN="$HOME/.local/bin"
export PATH="$LOCAL_BIN:$PATH"
if [[ ":$PATH:" != *":$LOCAL_BIN:"* ]]; then
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.bashrc"
fi

# Build the initial setup
echo "🏗️ Building initial packages..."
pnpm build

# Fix JupyterLab permissions for development mode installation
echo "🔐 Fixing JupyterLab directory permissions..."
sudo mkdir -p /usr/local/share/jupyter/labextensions
sudo chown -R vscode:vscode /usr/local/share/jupyter

# Install JupyterLab extension in development mode (creates symlink only)
echo "🔌 Installing JupyterLab extension..."
if [ -d "apps/jupyter" ]; then
    cd apps/jupyter
    jupyter labextension develop . --overwrite
    cd ../..
fi

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  - Start PWA dev server: pnpm dev:source"
echo "  - Start JupyterLab: jupyter lab"
echo "  - Build all packages: pnpm build"
echo "  - Run tests: pnpm test"
