# Release Guide for jupyterlab-niivue

This guide explains how to create releases for the `jupyterlab-niivue` JupyterLab extension that will be published to both PyPI (Python Package Index) and npm (Node Package Manager).

## 🚀 Quick Start

For automated releases using the manual script:

```bash
# Patch version (0.1.2 → 0.1.3)
./release.sh patch

# Minor version (0.1.2 → 0.2.0)
./release.sh minor

# Major version (0.1.2 → 1.0.0)
./release.sh major

# Specific version
./release.sh 1.2.3

# Dry run (test without making changes)
./release.sh patch --dry-run
```

## 📋 Prerequisites

Before creating your first release, you need to set up the following:

### 1. GitHub Repository Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `PYPI_API_TOKEN`: Your PyPI API token
- `NPM_TOKEN`: Your npm access token
- `ADMIN_GITHUB_TOKEN`: GitHub token with admin permissions (optional, for advanced features)

### 2. Package Registry Accounts

#### PyPI Setup
1. Create an account on [PyPI](https://pypi.org/account/register/)
2. Enable 2FA on your account
3. Create an API token:
   - Go to [Account Settings](https://pypi.org/manage/account/) → API tokens
   - Click "Add API token"
   - Scope: "Entire account" (for first release) or specific project
   - Copy the token (starts with `pypi-`)

#### npm Setup
1. Create an account on [npmjs.com](https://www.npmjs.com/signup)
2. Enable 2FA on your account
3. Create an access token:
   - Go to [Access Tokens](https://www.npmjs.com/settings/tokens)
   - Click "Generate New Token" → "Granular Access Token"
   - Scope: "Read and write" for your packages
   - Copy the token

### 3. Development Environment

Ensure you have the following installed:
- Python 3.8+
- Node.js 18+
- JupyterLab 4.0+

## 🔧 Manual Release Process

If you prefer to release manually or need to troubleshoot:

### Step 1: Prepare the Release

1. **Ensure clean working directory:**
   ```bash
   git status  # Should show no uncommitted changes
   ```

2. **Update version in package.json:**
   ```bash
   cd niivue-jupyter
   npm version patch  # or minor, major, or specific version like 1.2.3
   ```

3. **Update Python version (if needed):**
   The Python version is automatically synced from package.json via the `hatch-nodejs-version` plugin.

### Step 2: Build and Test

1. **Install dependencies:**
   ```bash
   cd niivue-jupyter
   npm ci
   ```

2. **Build the extension:**
   ```bash
   npm run build:prod
   ```

3. **Run tests:**
   ```bash
   npm run lint:check
   npm test
   ```

4. **Test installation:**
   ```bash
   pip install -e .[test]
   jupyter labextension list
   ```

### Step 3: Create GitHub Release

1. **Commit and tag:**
   ```bash
   git add package.json
   git commit -m "Release v$(node -p 'require("./niivue-jupyter/package.json").version')"
   git tag "v$(node -p 'require("./niivue-jupyter/package.json").version')"
   git push origin main
   git push origin --tags
   ```

2. **Create GitHub release:**
   - Go to your repository on GitHub
   - Click "Releases" → "Create a new release"
   - Select the tag you just pushed
   - Add release notes
   - Click "Publish release"

### Step 4: Publish to Registries

The GitHub Actions workflow will automatically publish to PyPI and npm when you create a release.

## 🔄 Automated Release Workflow

The project includes GitHub Actions workflows that automate the release process:

### Files Added:
- `.github/workflows/release.yml`: Handles drafting and publishing releases
- `.github/workflows/test.yml`: Runs tests on PRs and pushes
- `.jupyter-releaser.json`: Configuration for Jupyter releaser
- `release.sh`: Manual release script

### Workflow Triggers:

1. **Automatic on tag push:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Manual workflow dispatch:**
   - Go to Actions tab in GitHub
   - Select "Release" workflow
   - Click "Run workflow"
   - Specify version and branch

## 📦 Package Structure

The extension is published as:
- **Python package:** `jupyterlab-niivue` on PyPI
- **npm package:** `jupyterlab-niivue` on npm

Both packages contain the same JupyterLab extension but in different formats:
- Python package includes the built labextension
- npm package is for development and contains TypeScript source

## 🐛 Troubleshooting

### Common Issues:

1. **Build fails:**
   - Ensure all dependencies are installed: `npm ci`
   - Check for TypeScript errors: `npm run build`

2. **Tests fail:**
   - Run linting: `npm run lint:check`
   - Check test output: `npm test`

3. **Stylelint errors:**
   - The project uses a relaxed stylelint configuration for development
   - CSS class naming patterns are not enforced to allow for flexibility
   - If you encounter stylelint errors, check `.stylelintrc.json` configuration

4. **Publishing fails:**
   - Verify API tokens are correct
   - Check package name availability
   - Ensure version number is unique

5. **JupyterLab installation fails:**
   - Check JupyterLab compatibility in `package.json`
   - Verify extension is properly built: `jupyter labextension list`

### Getting Help:

- Check GitHub Actions logs for detailed error messages
- Review the [JupyterLab Extension Development Guide](https://jupyterlab.readthedocs.io/en/stable/extension/extension_dev.html)
- Open an issue in the repository

## 📚 Additional Resources

- [Jupyter Releaser Documentation](https://jupyter-releaser.readthedocs.io/)
- [PyPI Publishing Guide](https://packaging.python.org/en/latest/tutorials/packaging-projects/)
- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [JupyterLab Extension Tutorial](https://github.com/jupyterlab/extension-template)
