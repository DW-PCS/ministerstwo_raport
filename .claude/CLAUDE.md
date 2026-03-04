# Project Instructions

## Architecture

- Always use **Server Actions** to fetch or mutate data
- Never fetch data in `useEffect`
- Prefer **Server Components** by default
- Use **component architecture** to build the view (small, composable components)
- Split all non-trivial logic into **custom hooks**
- Components must stay declarative and minimal
- middleware.ts is now proxy.ts, use proxy.ts

## Hooks

- Hooks contain logic only
- No data fetching in `useEffect`
- Hooks may call Server Actions
- One responsibility per hook

## Code Style

- Respect **KISS**
- Prefer clarity over abstraction
- Match existing patterns
- Never add comments
- Do not explain code unless explicitly asked
- always use react-hook-form for forms

## Types

- Move all types out of components and hooks
- Organize by responsibility

Structure:
types/
index.ts

- Re-export from `types/index.ts`
- No inline or local types in components other then component props

## Constants

- Move constants out of components and hooks
- Organize by responsibility
  Structure:
  constants/
  index.ts
- Re-export from `constants/index.ts`

## Server Actions

- All data access must go through Server Actions
- Organize by domain
  actions/
- No direct fetching outside `actions/`
- Components and hooks must not access APIs directly

## Output Rules

- Output code only
- No comments
- No explanations
- Ask before making breaking changes

## Styles

- use cn to conditonal styles
- utils\cn.ts

## Ui

- Ui text should always be in polsish language (PL)

## COPY

- move all text used in ui to the PL and EN json and add matching pair to the translation.tsv and use t() for the translation text
