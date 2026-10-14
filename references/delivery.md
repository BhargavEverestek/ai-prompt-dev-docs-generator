# Delivery: in-app docs UI or Markdown only

The docs are always Markdown files in `docs/`, and those files are the source of
truth either way.

- **In-app UI:** the application renders `docs/` at a route such as `/docs/`,
  behind its own login. A per-environment flag turns it on.
- **Markdown only:** developers read `docs/` in the repo host (GitHub, GitLab,
  Bitbucket, Azure Repos) or in their editor.

Both use the same files, so a project can start with Markdown only and add the
UI later.

Never propose a third-party docs site or separate hosting.

## Decision

Propose the in-app UI only when **all** of these are true. Otherwise propose
Markdown only and give the reason in one line.

| #   | Condition                                                              | How to check                                                                                                                    |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | The project is a **web app** that developers run in a browser          | Not backend-only, a library, a CLI, mobile (React Native, Flutter, native) or IaC                                               |
| 2   | A **recipe matches** the stack, or the build has a step you can extend | Stack table below → `ui-recipes.md`                                                                                             |
| 3   | There's an **auth layer** to put the docs behind                       | Login and route guards or middleware. If there's none, propose the UI only with the flag on in non-public environments, and ask |
| 4   | **Per-environment config** exists or is easy to add                    | Env files, config files per stage, build-time env vars, environment files                                                       |
| 5   | It **doesn't need a framework or build-tool upgrade**                  | The chosen libraries work with the installed framework, Node version and module system (CommonJS or ESM)                        |

In a monorepo, host the UI in the app the developers use most. It renders docs
for the whole repo.

## Stack detection

| Signal                                                                                                              | Stack                      | Recipe in `ui-recipes.md`                             |
| ------------------------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------- |
| `gatsby` dependency                                                                                                 | Gatsby                     | Gatsby                                                |
| `next` dependency with an `app/` dir                                                                                | Next.js App Router         | Next.js (App Router)                                  |
| `next` dependency with a `pages/` dir only                                                                          | Next.js Pages Router       | Next.js (Pages Router)                                |
| `vite` + `react`                                                                                                    | React SPA (Vite)           | Vite SPA                                              |
| `vite` + `vue` (no `nuxt`)                                                                                          | Vue SPA (Vite)             | Vite SPA                                              |
| `nuxt`                                                                                                              | Nuxt                       | Nuxt                                                  |
| `@sveltejs/kit`                                                                                                     | SvelteKit                  | SvelteKit                                             |
| `@angular/core`                                                                                                     | Angular                    | Angular                                               |
| `react-scripts`, a custom webpack/rollup/parcel/esbuild setup, other SPAs                                           | Generic SPA                | Universal prebuild                                    |
| `@remix-run/*`, React Router framework mode, Astro, other SSR frameworks                                            | SSR framework              | Closest of Next.js / SvelteKit; or universal prebuild |
| Django, Flask/FastAPI with templates, Rails, Laravel, Express/Koa with a view engine, ASP.NET MVC/Razor, Spring MVC | Server-rendered            | Server-rendered apps                                  |
| `react-native`, `expo`, `pubspec.yaml`, Android/iOS projects                                                        | Mobile                     | Markdown only                                         |
| No UI                                                                                                               | Backend, library, CLI, IaC | Markdown only                                         |

## Markdown-only notes

- GitHub and GitLab render Mermaid code blocks. Other hosts may not, so check.
  If yours doesn't, keep each diagram small and add a one-line text summary
  under it.
- Relative links between pages and to code files work in every repo host. Keep
  them relative.
- Put a short `docs/README.md` with the reading order at the top of `docs/`.
  Repo hosts show it when someone opens the folder.
