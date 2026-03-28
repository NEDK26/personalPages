# AGENTS.md

This file is for coding agents working in `/Users/minda66/Desktop/projects/demo-personal-project-fullstack`.

## Repository Scope

- The active applications live in both `backend/` and `frontend/`.
- `backend/` is the Hono API and content persistence layer.
- `frontend/` is the Vite + React app and also contains the Vercel proxy functions used in production.
- There is no existing monorepo task runner; use package-level commands directly.
- Do not assume missing tooling exists. Check `backend/package.json` or `frontend/package.json` before introducing new commands.

## Project Layout

- `backend/src/app.ts` builds the Hono app and mounts routes.
- `backend/src/server.ts` starts the Node server.
- `backend/src/routes/` contains HTTP route modules.
- `backend/src/config/` contains environment parsing and config helpers.
- `backend/src/db/` contains database client setup.
- `backend/src/data/` contains static response content.
- `backend/dist/` is compiled output; do not edit it manually.
- `backend/.env.example` documents expected environment variables.
- `frontend/src/app/App.tsx` contains the main UI and admin dialog.
- `frontend/src/lib/api.ts` contains browser-side API calls and always talks to same-origin `/api`.
- `frontend/api/` contains explicit Vercel serverless proxy routes such as `health.ts`, `profile.ts`, and `admin/login.ts`.
- `frontend/vercel.json` contains the frontend Vercel build settings.

## Working Directory

- For backend commands, run from `backend/`.
- For frontend commands and Vercel proxy work, run from `frontend/`.
- Repository root is useful for cross-project documentation only.
- When referencing files in agent output, use workspace-relative paths such as `backend/src/app.ts` or `frontend/src/app/App.tsx`.

## Setup

- Install dependencies with `npm install` from both `backend/` and `frontend/` when needed.
- Copy `backend/.env.example` to `backend/.env` when local environment variables are needed.
- Do not commit `backend/.env`.
- Required runtime values are validated in `backend/src/config/env.ts`.

## Environment Variables

- Backend:
- `PORT`: server port; defaults to `3000` via Zod coercion.
- `FRONTEND_ORIGINS`: comma-separated allowed origins for backend CORS.
- `ADMIN_USERNAME`: admin basic-auth username; defaults to `admin`.
- `ADMIN_PASSWORD`: admin basic-auth password; defaults to `190828xmd`.
- `BLOB_READ_WRITE_TOKEN`: optional unless Blob-backed image uploads are required.
- `TURSO_DATABASE_URL`: optional unless database-backed features are required.
- `TURSO_AUTH_TOKEN`: optional unless database-backed features are required.
- `NODE_ENV`: parsed as `development | test | production`; defaults to `development`.
- Frontend:
- `VITE_API_BASE_URL`: keep this as `/api` in production so the browser talks to same-origin proxy routes.
- `VITE_PROXY_TARGET`: local Vite dev proxy target; defaults to `http://localhost:3000`.
- `BACKEND_API_BASE_URL`: set this only in the frontend Vercel project runtime so serverless proxy routes know where the backend is deployed.

## Vercel Frontend-Backend Connection

- Deploy `backend/` and `frontend/` as separate Vercel projects.
- In production, the browser must call same-origin frontend routes like `/api/profile` and `/api/admin/login`; do not point the browser directly at the backend Vercel domain.
- The frontend Vercel project forwards requests to the real backend using `BACKEND_API_BASE_URL`.
- Keep `frontend/.env.production` on `VITE_API_BASE_URL=/api`; if someone sets it to an absolute backend URL, the production browser flow is wrong.
- Use explicit route files in `frontend/api/` for every public and admin backend endpoint. This repo intentionally avoids a catch-all Vercel API proxy because nested routes caused 404 and function invocation failures after deployment.
- Current public proxy files are `frontend/api/health.ts`, `frontend/api/profile.ts`, `frontend/api/now.ts`, `frontend/api/lives.ts`, and `frontend/api/highlights.ts`.
- Current admin proxy files are `frontend/api/admin/login.ts`, `frontend/api/admin/content.ts`, `frontend/api/admin/profile.ts`, `frontend/api/admin/now.ts`, `frontend/api/admin/lives.ts`, `frontend/api/admin/highlights.ts`, and `frontend/api/admin/lives/upload.ts`.
- After a frontend deploy, verify the proxy chain through the frontend domain first: `GET /api/health`, then `POST /api/admin/login` with basic auth.
- If frontend pages load but all `/api/*` requests fail, inspect the frontend Vercel functions first; if `/api/health` works but admin login fails, inspect backend admin env vars next.

## Build, Run, and Validation Commands

Run commands from the package directory they belong to.

- Backend install dependencies: `npm install` from `backend/`
- Backend dev server: `npm run dev` from `backend/`
- Backend build TypeScript to `dist/`: `npm run build` from `backend/`
- Backend compiled server: `npm run start` from `backend/`
- Backend type-check without emitting files: `npx tsc --noEmit` from `backend/`
- Frontend install dependencies: `npm install` from `frontend/`
- Frontend dev server: `npm run dev` from `frontend/`
- Frontend production build: `npm run build` from `frontend/`
- Frontend type-check: `npm run typecheck` from `frontend/`

## Lint Commands

- There is currently no lint script in `backend/package.json`.
- There is no ESLint, Biome, or Prettier config checked into this repository.
- Do not claim lint passed unless you first add and run lint tooling.
- If you add linting in the future, also document the exact command here.

## Test Commands

- There is currently no test runner configured in `backend/package.json`.
- There are currently no committed test files in the repository.
- Do not claim tests passed unless you first add a test framework and execute it.
- If you need a basic validation step today, use `npx tsc --noEmit` and manual endpoint checks.

## Running a Single Test

- Single-test execution is not available in the current repository because no test framework is configured.
- If you introduce a test runner, update this file with:
  - the full test command
  - the single-file test command
  - the single-test-name pattern command
- Until then, do not invent commands such as `npm test`, `vitest`, or `jest`.

## Manual Verification

- Start the backend locally with `npm run dev` from `backend/`.
- Start the frontend locally with `npm run dev` from `frontend/`.
- Check backend root endpoint directly: `GET http://localhost:3000/`
- Check backend health directly: `GET http://localhost:3000/health`
- Check frontend proxy health: `GET http://localhost:5173/api/health`
- Check public frontend proxy endpoints: `GET /api/profile`, `GET /api/now`, `GET /api/lives`, `GET /api/highlights`
- Check admin login through the frontend proxy: `POST /api/admin/login` with basic auth.
- When database credentials are absent, health should still respond and report database configuration accurately.

## Post-change Run Rule

- After adding or changing code, start the relevant local development server before finishing when the environment allows it.
- For backend changes, run `npm run dev` from `backend/`.
- For frontend changes, run `npm run dev` from `frontend/`.
- For changes that touch both apps, start both local dev servers so the project can be checked end to end.

## Existing Technical Conventions

- Language: TypeScript with `strict: true`.
- Module system: CommonJS output via TypeScript compiler.
- HTTP framework: Hono.
- Environment validation: Zod.
- Database client: `@libsql/client` for Turso/libSQL.

## Imports

- Put third-party imports first.
- Separate local imports from third-party imports with one blank line.
- Use relative imports within `backend/src/`.
- Keep imports minimal; remove unused imports immediately.
- Follow the existing style of double-quoted module specifiers.

## Formatting

- Match the existing code style already present in `backend/src/`.
- Use double quotes, not single quotes.
- Use semicolons.
- Preserve trailing commas where the formatter or existing style uses them.
- Keep one blank line between logical import groups and between major blocks.
- Prefer readable multi-line object literals over dense one-line structures.

## Types

- Prefer TypeScript inference for obvious local values.
- Add explicit types at module boundaries when they improve clarity.
- Keep `strict` compatibility; do not weaken compiler settings to make code compile.
- Avoid `any` unless absolutely necessary and justified.
- Prefer narrowing over assertions.
- If using an assertion, keep it local and explain it with code structure rather than comments.

## Naming Conventions

- Use `camelCase` for variables, functions, and object properties.
- Use `PascalCase` for types, interfaces, classes, and Zod schemas when exported as type-like constructs.
- Use `UPPER_SNAKE_CASE` only for true constants with process/env-style semantics.
- Use `kebab-case` for file names, matching files like `public-content.ts`.
- Name Hono router instances with a `Router` suffix, e.g. `healthRouter`, `publicRouter`.
- Use descriptive names such as `checkDatabaseConnection` instead of abbreviated verbs.

## File Organization

- Keep route definitions inside `backend/src/routes/`.
- Keep config parsing and derived config helpers inside `backend/src/config/`.
- Keep database setup inside `backend/src/db/`.
- Keep static content or fixtures in `backend/src/data/`.
- Prefer creating a new module only when logic is reused or meaningfully isolated.

## Route and Handler Style

- Keep handlers small and focused.
- Return JSON directly from handlers.
- Keep root route registration centralized in `backend/src/app.ts`.
- Mount routers with `app.route()` rather than inlining all endpoints in one file.
- Use response shapes that are easy for clients to consume consistently.

## Error Handling

- Fail fast for invalid startup configuration.
- Parse environment variables with Zod before using them.
- In `catch` blocks, treat errors as `unknown` and narrow with `instanceof Error` before reading `.message`.
- Return explicit HTTP status codes for operational failures.
- Prefer stable error payloads over leaking raw implementation details.
- Log startup/configuration failures clearly.

## Database and Configuration Guidance

- Treat the Turso connection as optional unless the feature truly requires it.
- Preserve the current pattern where database availability is derived from validated env state.
- Do not hardcode secrets, tokens, or URLs.
- Keep secret values in environment variables only.
- If database access is optional, make the API behavior explicit when config is missing.

## Exports

- Prefer named exports for reusable values and helpers.
- The existing app entry uses a default export from `backend/src/app.ts`; keep that unless there is a strong reason to refactor.
- Keep export style consistent within a module.

## Comments

- Add comments only when a block is non-obvious.
- Do not add comments that restate the code literally.
- Prefer expressive names and small functions over explanatory comments.

## Generated and Ignored Files

- Do not hand-edit `backend/dist/`.
- Source of truth is `backend/src/`.
- `backend/node_modules/` is installed state, not project source.
- Respect `.gitignore`: `node_modules`, `dist`, and `.env` should remain uncommitted unless the repo owner changes policy.

## Agent Guardrails

- Before making changes, inspect existing patterns in nearby files and follow them.
- Keep edits minimal and targeted.
- Do not add large frameworks or repo-wide tooling unless the task calls for it.
- Do not fabricate CI, lint, or test commands that are not present.
- If you add new tooling, update `backend/package.json` and this file together.
- Prefer changes in source files over generated artifacts.

## Cursor and Copilot Rules

- No `.cursorrules` file is present.
- No `.cursor/rules/` directory is present.
- No `.github/copilot-instructions.md` file is present.
- There are currently no repository-specific Cursor or Copilot instruction files to incorporate.

## If You Add Tests Later

- Add a script to `backend/package.json`.
- Add the exact suite command to this file.
- Add a documented single-test command to this file.
- Prefer deterministic tests that do not require live external services unless clearly marked as integration tests.

## If You Add Linting Later

- Add a script to `backend/package.json`.
- Commit the corresponding config file.
- Document autofix and check-only commands here.
- Keep style rules aligned with the current TypeScript and Hono code patterns.
