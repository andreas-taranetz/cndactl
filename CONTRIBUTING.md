# Contributing

This document is for contributors and maintainers working on `cndactl`.

## Requirements

- Bun
- Node.js

## Setup

```bash
bun install
```

## Common Workflows

Run the CLI in development mode:

```bash
bun run dev -- get sessions
```

Build the distributable output:

```bash
bun run build
```

Link the local command into Bun's global bin directory:

```bash
bun run link
cndactl get sessions
```

Remove the local link again:

```bash
bun run unlink
```

## Publishing

This section is for maintainers publishing `cndactl` to the npm registry.

### Automated Release

The automated release flow is split across two GitHub Actions workflows:

- [.github/workflows/release.yml](.github/workflows/release.yml) creates a GitHub Release from a pushed version tag.
- [.github/workflows/publish.yml](.github/workflows/publish.yml) publishes to npm when that GitHub Release is published.

To publish a new version:

```bash
bun install
bun run typecheck
bun run test
bun run build
git tag v0.1.0
git push origin v0.1.0
```

Pushing the tag creates the GitHub Release first. The npm publish then runs in a separate workflow that is triggered by the published release event.

The repository keeps a version in `package.json` for normal local development and package metadata. During the publish workflow, the CI checkout overrides that value with the release tag version, so the npm release always follows the release tag.

Before tagging, make sure npm trusted publishing is configured for this repository and that the trusted publisher workflow filename is `publish.yml`.

### Release Checklist

```bash
bun install
bun run typecheck
bun run test
bun run build
bun pm pkg set version=0.1.0
bun run publish:dry-run
git restore package.json
```

### Authenticate

Manual authentication is only needed for fallback or dry-run publishing outside GitHub Actions.

For local publishing, set the version explicitly before running the publish command:

```bash
bun pm pkg set version=0.1.0
bun run publish:release
git restore package.json
```

Authenticate against the npm registry before publishing:

```bash
bunx npm login
```

You can also use an npm-compatible auth token through your registry configuration.

Verify the active account if needed:

```bash
npm whoami
```

### Publish

Publish the current package version:

```bash
bun pm pkg set version=0.1.0
bun run publish:release
git restore package.json
```

## Notes

- Bun is the primary package manager and script runner for this repository.
- The release workflow uses Node.js 24 because npm trusted publishing requires a recent npm CLI in GitHub Actions.
- The published package is still an npm-compatible package, so consumers can use either `npx cndactl` or `bunx cndactl`.
- Local publish commands require setting a temporary version in `package.json` before publishing.
- The npm package page will render the root `README.md`, so keep that file consumer-focused.
