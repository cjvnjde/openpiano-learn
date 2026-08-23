# AGENTS.md

## Repository layout

- `apps/*` - applications
  - `web` - Solid 2 application; use https://v2.solidjs.com/llms-full.txt as the framework reference
- `packages/*` - shared packages

## Architecture

The web app uses layered modules: `app → modules → features → shared`. Imports only point right.

- `app`: global composition, routing, providers, and initialization; the only layer that imports modules.
- `modules`: self-contained sections that may import features and shared, never other modules.
- `features`: OpenPiano-specific capabilities reused by modules; may import shared, never modules or other features.
- `shared`: project-agnostic `ui`, `lib`, `platform`, and `styles`; imports no upper layer.
- Modules and features expose only `index.ts`; external deep imports are prohibited.
- Keep code in its module until another module needs it. Then move project-specific code to features and project-agnostic or cross-feature code to shared.
- Colocate private helpers, styles, and tests. Create packages only for cross-application reuse.

## Naming

- Use kebab-case for application source filenames and directories.
- Keep framework- and tool-required filenames exact, including `App.tsx`, `Document.tsx`, `vite.config.ts`, and `AGENTS.md`.
- Prefer named exports. Use default exports only when a framework convention requires them; Solid's generated entries require default exports from `App.tsx` and `Document.tsx`.

## Tooling

- pnpm — workspace and dependency management
- oxfmt — formatting
