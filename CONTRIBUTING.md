# Contributing

This document is for contributors and maintainers working on `cndactl`.

## Requirements

- Node.js >= 22
- pnpm

## Setup

```bash
pnpm install
pnpm run prepare
```

`pnpm run prepare` installs local Git hooks via Husky:

- `pre-commit` runs `pnpm run typecheck`
- `pre-push` runs `pnpm run test`

## Common Workflows

Run the CLI in development mode:

```bash
pnpm run dev -- get sessions
```

Build the distributable output:

```bash
pnpm run build
```

Link the local command into pnpm's global bin directory:

```bash
pnpm run link
cndactl get sessions
```

Remove the local link again:

```bash
pnpm run unlink
```

## Publishing

This section is for maintainers publishing `cndactl` to the npm registry.

### Automated Release

A new release will be published to npmjs whenever a new github release is created.
See [.github/workflows/publish.yml](.github/workflows/publish.yml).

```bash
gh release create v0.1.0 --title v0.1.0
```
Or go to [Create Release](https://github.com/andreas-taranetz/cndactl/releases/new).

### Authenticate

Manual authentication is only needed for fallback or dry-run publishing outside GitHub Actions.

For local publishing, set the version explicitly before running the publish command:

```bash
pnpm pkg set version=0.1.0
pnpm run publish:release
git restore package.json
```

Authenticate against the npm registry before publishing:

```bash
npm login
```

You can also use an npm-compatible auth token through your registry configuration.

Verify the active account if needed:

```bash
npm whoami
```

## Notes

- pnpm is the primary package manager and script runner for this repository.
- The release workflow uses Node.js 24 because npm trusted publishing requires a recent npm CLI in GitHub Actions.
- The published package is still an npm-compatible package, so consumers can use either `npx cndactl` or `pnpm dlx cndactl`.
- Local publish commands require setting a temporary version in `package.json` before publishing.
- The npm package page will render the root `README.md`, so keep that file consumer-focused.
