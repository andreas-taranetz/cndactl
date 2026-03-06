# Contributing

This document is for contributors and maintainers working on `cndactl`.

## Requirements

- Bun 1.3 or newer
- Node.js 20 or newer
- Network access to the public Sessionize event feed

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

### Release Checklist

```bash
bun install
bun run check
bun run build
bun run publish:dry-run
```

### Authenticate

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
bun run publish:release
```

### Local Package Archive

Create a local package tarball for inspection:

```bash
bun run pack:local
```

## Notes

- Bun is the primary package manager and script runner for this repository.
- The published package is still an npm-compatible package, so consumers can use either `npx cndactl` or `bunx cndactl`.
- `bun publish --dry-run` still requires registry authentication.
- The npm package page will render the root `README.md`, so keep that file consumer-focused.
