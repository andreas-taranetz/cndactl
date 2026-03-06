# Development

This document is for contributors working on `cndactl` locally.

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

Run checks:

```bash
bun run check
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

## Coverage

Run coverage locally with:

```bash
bunx vitest run --coverage
```

## Notes

- Bun is the primary package manager and script runner for this repository.
- The published package is still an npm-compatible package, so consumers can use either `npx cndactl` or `bunx cndactl`.
