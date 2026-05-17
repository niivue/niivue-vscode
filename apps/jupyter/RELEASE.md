# Release Guide — `jupyterlab_niivue`

Day-to-day releases happen automatically via Changesets — see the monorepo's [Release.md](../../Release.md) for the full flow. **You should not need this file unless you are doing a manual emergency release** (PyPI was down during a scheduled release, the CI workflow broke, etc.).

## Package layout

- Python package on PyPI: **`jupyterlab_niivue`** (underscores; PyPI normalizes from the `name` in `pyproject.toml`).
- Build backend: [`hatchling`](https://hatch.pypa.io) with [`hatch-nodejs-version`](https://github.com/agoose77/hatch-nodejs-version), so the wheel's version is derived dynamically from `package.json` at build time — there is no static `version` line to update in `pyproject.toml`.

## Manual emergency release

From `apps/jupyter`:

```bash
# Confirm what would be uploaded — does not publish
pnpm release:check

# Publish to TestPyPI first (recommended) to validate the wheel in a
# fresh devcontainer before touching production PyPI
pnpm release:test

# Publish to PyPI
pnpm release:prod
```

All three scripts run `clean:all && build:prod && python -m build --wheel` and then either `twine check`, `twine upload --repository testpypi`, or `twine upload`. You will need `TWINE_USERNAME=__token__` and `TWINE_PASSWORD=<your-pypi-token>` in the environment.

The version that gets published is whatever `apps/jupyter/package.json` currently says — bump it before running if you want a different version.

## Why no npm publish

The npm package (`@niivue/jupyter`) is marked `"private": true` because the JupyterLab extension is distributed exclusively through PyPI. The npm name only exists so the monorepo can `pnpm`-wire its workspace dependencies.
