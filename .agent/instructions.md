# Agent Instructions - Bensa

## Core Mandate: Workspace Synchronization

- **Always Sync on Completion**: You MUST fully synchronize the workspace after completing any task or making significant changes.
- **Follow Workflow**: Follow the steps defined in `.agent/workflows/sync-workspace.md` rigorously.
- **Git State**: Ensure all changes are staged and committed with descriptive messages, then pushed to the remote repository.

## Testing & Validation

- **NEVER sync/push without testing**: Always ensure that all local checks pass before pushing to the remote repository.
- **GitHub Actions Parity**: Before committing, you MUST ensure that the same checks performed in `.github/workflows/pipeline.yml` would pass locally. This includes:
  - **Linting**: `npm run lint -w bensa-web`
  - **Unit Tests**: `npm run test -w bensa-web`
  - **Type Checking**: `npx tsc -b web/tsconfig.json` and `npx tsc -p bot/tsconfig.json --noEmit`
  - **Build**: `npm run build` (Ensures both web and bot projects compile correctly)
- **Husky Integration**: The project uses Husky and `lint-staged` to enforce these checks. Do not bypass these hooks.

## Internationalization (i18n)

- **Every word via i18n**: All user-facing text must be internationalized using `react-i18next`.
- **Sync Locales**: When adding a new translation key, ensure it is added to both `en.json` and `fi.json` (and their nested counterparts in `locales/en/` and `locales/fi/`).

## Coding Standards

- **Neobrutalist / Modern Aesthetic**: Follow the established design patterns (bold borders, high contrast, vibrant colors, wacky animations).
- **TypeScript**: Maintain strict type safety. Avoid `any` where possible.
- **React 19 Patterns**: Use modern React 19 patterns and ensure tests are compatible (use `act` and `findBy` where necessary).
