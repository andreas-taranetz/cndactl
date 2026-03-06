# Publishing

This document is for maintainers publishing `cndactl` to the npm registry.

## Release Checklist

```bash
bun install
bun run check
bun run build
bun run publish:dry-run
```

## Authenticate

Authenticate against the npm registry before publishing:

```bash
bunx npm login
```

You can also use an npm-compatible auth token through your registry configuration.

Verify the active account if needed:

```bash
npm whoami
```

## Publish

Publish the current package version:

```bash
bun run publish:release
```

## Local Package Archive

Create a local package tarball for inspection:

```bash
bun run pack:local
```

## Notes

- `bun publish --dry-run` still requires registry authentication.
- The npm package page will render the root `README.md`, so keep that file consumer-focused.
