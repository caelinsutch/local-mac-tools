# Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for managing releases.

## Publishing a new version

### 1. Create changesets for your changes

When you make changes that should be published, create a changeset:

```bash
pnpm changeset
```

This will prompt you to:
- Select which packages changed (imessage-sdk, contacts-sdk, mcp-server)
- Select the type of change (patch/minor/major)
- Write a summary of the changes

The changeset file will be committed with your changes.

### 2. Version packages

When you're ready to release, run:

```bash
pnpm version
```

This will:
- Update package versions based on changesets
- Generate/update CHANGELOG.md files
- Delete the changeset files
- Update pnpm-lock.yaml

Commit these changes:

```bash
git add .
git commit -m "chore: version packages"
```

### 3. Publish to npm

```bash
pnpm release
```

This will:
- Build all packages
- Publish changed packages to npm
- Create git tags for the releases

### 4. Push to GitHub

```bash
git push --follow-tags
```

## Quick reference

```bash
# Add a changeset
pnpm changeset

# Version packages
pnpm version

# Publish to npm
pnpm release

# All in one (after creating changesets)
pnpm version && git add . && git commit -m "chore: version packages" && pnpm release && git push --follow-tags
```

## Changeset types

- **patch** (1.0.0 → 1.0.1): Bug fixes, small changes
- **minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **major** (1.0.0 → 2.0.0): Breaking changes