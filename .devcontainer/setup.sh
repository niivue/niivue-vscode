#!/bin/bash
set -e

echo "🚀 Setting up NiiVue development environment..."

# Configure git to trust the workspace directory
WORKSPACE_DIR="/workspaces/niivue-vscode"
if [ -d "$WORKSPACE_DIR" ]; then
    git config --global --add safe.directory "$WORKSPACE_DIR"
fi

# Install Node.js v22 and npm if missing or wrong version
NODE_VERSION=$(node -v 2>/dev/null || echo "none")
if [[ "$NODE_VERSION" != v22.* ]] || ! command -v npm &> /dev/null; then
    echo "🟢 Node.js v22 or npm not found (Current Node: $NODE_VERSION). Installing..."
    
    # Remove any existing Node.js installations
    sudo apt-get remove -y nodejs npm 2>/dev/null || true
    
    # Clean up any problematic repositories
    sudo rm -f /etc/apt/sources.list.d/yarn.list 2>/dev/null || true
    
    # Install Node.js v22 from NodeSource
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    echo "✅ Node.js $(node -v) and npm $(npm -v) installed."
else
    echo "✅ Node.js $NODE_VERSION and npm are already installed."
fi

# Ensure local bin exists and is in PATH for this script
LOCAL_BIN="$HOME/.local/bin"
mkdir -p "$LOCAL_BIN"
export PATH="$LOCAL_BIN:$PATH"

# Setup pnpm global directory
export PNPM_HOME="$HOME/.pnpm-global"
export PATH="$PNPM_HOME:$PATH"

# Install pnpm globally if missing
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm@latest
else
    echo "✅ pnpm is already installed."
fi

# Configure pnpm global bin directory
pnpm config set global-bin-dir "$LOCAL_BIN"

# Install VS Code extension development tools globally
if ! command -v vsce &> /dev/null || ! command -v ovsx &> /dev/null; then
    echo "📦 Installing VS Code extension tools (vsce, ovsx)..."
    pnpm install -g @vscode/vsce ovsx
else
    echo "✅ VS Code extension tools already installed."
fi

# Configure pnpm store to be persistent in the workspace
echo "⚙️ Configuring pnpm store..."
PNPM_STORE="$WORKSPACE_DIR/.pnpm-store"
mkdir -p "$PNPM_STORE"
pnpm config set store-dir "$PNPM_STORE"

# Install all dependencies if node_modules is missing
if [ ! -d "node_modules" ]; then
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
else
    echo "✅ Project dependencies already installed. Skipping pnpm install."
fi

# Install Playwright browsers and dependencies (if missing or check specific binary)
# Using the specific package command as per upstream, but only if not already installed
if [ ! -d "/ms-playwright" ] && [ ! -d "$HOME/.cache/ms-playwright" ]; then
    echo "🎭 Installing Playwright browsers..."
    pnpm --filter @niivue/pwa exec playwright install --with-deps
else
     echo "✅ Playwright browsers likely installed."
fi


# Install Python development dependencies for Jupyter if missing
if ! python3 -c "import jupyterlab" &> /dev/null; then
    echo "🐍 Setting up Python environment..."
    pip install --upgrade pip
    pip install "jupyterlab>=4.0.0" jupyter-packaging build hatch twine
    pip install coverage pytest pytest-asyncio pytest-cov pytest-jupyter pytest-xvfb
else
    echo "✅ Python dependencies already installed."
fi


# Add to .profile for login shells (including non-interactive)
if ! grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" "$HOME/.profile" 2>/dev/null; then
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.profile"
fi

# Also add to .bashrc for interactive shells
if ! grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" "$HOME/.bashrc" 2>/dev/null; then
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\"" >> "$HOME/.bashrc"
fi

# Fix permissions for the workspace (crucial for build)
# Only run if ownership is incorrect to save time on Windows
CURRENT_OWNER=$(stat -c '%U:%G' /workspaces/niivue-vscode 2>/dev/null || echo "unknown")
TARGET_OWNER="$(whoami):$(whoami)"
if [ "$CURRENT_OWNER" != "$TARGET_OWNER" ]; then
    echo "🔐 Fixing workspace permissions (current: $CURRENT_OWNER, target: $TARGET_OWNER)..."
    sudo chown -R $(whoami):$(whoami) /workspaces/niivue-vscode
else
    echo "✅ Workspace permissions are correct."
fi

# Build the initial setup if workspace-state or similar is missing (simplified check)
if [ ! -d "packages/niivue-react/dist" ]; then
    echo "🏗️ Building initial packages..."
    pnpm build
else
    echo "✅ Packages already built. Skipping pnpm build."
fi

# Fix JupyterLab permissions for development mode installation
echo "🔐 Fixing JupyterLab directory permissions..."
sudo mkdir -p /usr/local/share/jupyter/labextensions
sudo chown -R $(whoami):$(whoami) /usr/local/share/jupyter

# Install JupyterLab extension in development mode if not already developed
if [ ! -L "/usr/local/share/jupyter/labextensions/@niivue/jupyter" ]; then
    # Verify jupyter is available
    if command -v jupyter &> /dev/null; then
        echo "🔌 Installing JupyterLab extension in development mode..."
        # Build the extension first (if not already built)
        if [ ! -f "apps/jupyter/jupyterlab_niivue/labextension/package.json" ]; then
            echo "📦 Building Jupyter extension..."
            pnpm --filter @niivue/jupyter build
        fi
        # Link the extension
        jupyter labextension link apps/jupyter --no-build
    else
        echo "⚠️ Jupyter not found in PATH. Skipping extension installation."
    fi
else
    echo "✅ Jupyter extension already installed in dev mode."
fi

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Quick start commands:"
echo "  - Start PWA dev server: pnpm dev:source"
echo "  - Start JupyterLab: jupyter lab"
echo "  - Build all packages: pnpm build"
echo "  - Run tests: pnpm test"
