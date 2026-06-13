# Repo notes for Claude

## Accessing the niivue/ upstream via GitHub API

The GitHub MCP tools in this environment are scoped to `korbinian90/niivue-vscode`. For the upstream `niivue/niivue-vscode` (which is where PRs actually land and get reviewed), fall back to `curl` against the public REST API — no auth needed for public repos, though the shared-IP rate limit occasionally kicks in (retry after ~30 s).

Useful endpoints (GET, no auth):

```bash
# PR metadata
curl -sSL "https://api.github.com/repos/niivue/niivue-vscode/pulls/<N>"

# Reviews attached to a PR (summaries)
curl -sSL "https://api.github.com/repos/niivue/niivue-vscode/pulls/<N>/reviews"

# All inline review comment bodies on a PR
curl -sSL "https://api.github.com/repos/niivue/niivue-vscode/pulls/<N>/comments"

# Just the comments that belong to one review (matches ?pullrequestreview=ID URLs)
curl -sSL "https://api.github.com/repos/niivue/niivue-vscode/pulls/<N>/reviews/<REVIEW_ID>/comments"

# Issue-level comments (non-review comments)
curl -sSL "https://api.github.com/repos/niivue/niivue-vscode/issues/<N>/comments"
```

Always send `-H "Accept: application/vnd.github+json"`. WebFetch on GitHub PR pages returns stubs only (GitHub lazy-loads comment bodies via JS), so prefer the API.
