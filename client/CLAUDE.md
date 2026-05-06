# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # dev server at http://localhost:4200
npm run build      # production build → dist/
npm test           # run unit tests with Vitest
npm run watch      # dev build in watch mode
```

Generate a component: `ng generate component features/<name>/<name>`

## Architecture

Angular 21 standalone-component app (no NgModules). Entry: `src/main.ts` → `src/app/app.ts` (root, just a `<router-outlet>`).

**Routing** (`src/app/app.routes.ts`):
- `/` → redirects to `/lobby`
- `/lobby` → `Lobby` component (eager)
- `/board` → `Board` component (lazy, `loadComponent`)

**Features** live in `src/app/features/<name>/` — each owns its `.ts`, `.html`, `.css`, and `.spec.ts`.

**Styling**: Tailwind CSS v4 + DaisyUI v5, configured in `src/styles.css`. Themes: `light` (default) and `dark` (prefers-dark). Use DaisyUI component classes (`btn`, `hero`, `swap`, etc.) rather than raw Tailwind where possible.

**TypeScript**: strict mode + `noImplicitOverride`, `noImplicitReturns`, `strictTemplates`. All Angular compiler strict flags enabled.

**Testing**: Vitest (not Karma/Jasmine). Test files co-located with components as `*.spec.ts`.

**Formatting**: Prettier — 100 char width, single quotes, `angular` parser for HTML. No ESLint configured.
