#!/bin/bash
# Manual release script for jupyterlab-niivue
# Usage: ./release.sh [version] [--dry-run]

set -e

VERSION=${1:-"patch"}
DRY_RUN=${2:-""}

echo "🚀 Starting release process for jupyterlab-niivue..."

# Navigate to the extension directory
cd "$(dirname "$0")/niivue-jupyter"

# Check if working directory is clean
if ! git diff --quiet HEAD; then
    echo "❌ Working directory is not clean. Please commit your changes first."
    exit 1
fi

# Install dependencies and build
echo "📦 Installing dependencies..."
npm ci
echo "🔨 Building extension..."
npm run build:prod

# Run tests
echo "🧪 Running tests..."
npm run lint:check
npm test

# Update version
echo "📝 Updating version..."
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🔍 DRY RUN: Would update version to $VERSION"
    npm version --no-git-tag-version $VERSION
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "🔍 DRY RUN: New version would be $NEW_VERSION"
    git checkout package.json  # Revert version change in dry run
else
    npm version --no-git-tag-version $VERSION
    NEW_VERSION=$(node -p "require('./package.json').version")
    echo "✅ Updated version to $NEW_VERSION"
fi

# Build Python package
echo "🐍 Building Python package..."
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🔍 DRY RUN: Would build Python package"
else
    pip install build
    python -m build
fi

# Create git tag and push
if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "🔍 DRY RUN: Would create git tag v$NEW_VERSION and push"
else
    echo "🏷️  Creating git tag and pushing..."
    git add package.json
    git commit -m "Release v$NEW_VERSION"
    git tag "v$NEW_VERSION"
    git push origin main
    git push origin "v$NEW_VERSION"
fi

echo "✅ Release process completed!"
if [ "$DRY_RUN" != "--dry-run" ]; then
    echo "🎉 Version $NEW_VERSION has been released!"
    echo "💡 The GitHub Actions workflow will now handle PyPI and npm publishing."
else
    echo "🔍 This was a dry run. No changes were made."
fi
