# In-app docs UI recipes

The UI renders the Markdown in the docs folder (`docs/` by default) inside the
application, at a route such as `/docs/`, behind the app's login. A
per-environment flag turns it on. It is never a separate site.

Below, `/docs/` means the chosen docs route and `docs/` means the chosen docs
folder.

This file has three parts:

1. **The shared spec:** what every implementation must do.
2. **One recipe per stack.**
3. **The integration checklist.**

Present the recipe as a plan at checkpoint C before writing code.

## 1. Shared spec

### Must have

| Requirement              | Detail                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Free route**           | Before proposing `/docs/`, check that the app doesn't already use it, or any path under it. Check route definitions, server routes, rewrites and proxies, and API docs such as Swagger/OpenAPI UI, Redoc or FastAPI's built-in `/docs`. Also check static files the build serves from a `docs` folder (`public/docs/`, `static/docs/`). If it's taken, propose `/dev-docs/` and show what already uses `/docs` |
| **Flag per environment** | Off → no docs route, no docs button, and no docs content or Markdown/diagram libraries in the build. Default: on in dev/QA, off in production                                                                                                                                                                                                                                                                  |
| **Behind login**         | Reuse the app's existing auth gate (route guard, layout wrapper or middleware). Don't build a new one                                                                                                                                                                                                                                                                                                          |
| **Build-time Markdown**  | Turn Markdown into HTML at build or server time where the stack allows, so there's no Markdown parser in the browser bundle. Runtime parsing is a fallback only                                                                                                                                                                                                                                                |
| **Published pages**      | Only files with a `title` in their frontmatter become pages                                                                                                                                                                                                                                                                                                                                                    |
| **Ordering and URLs**    | Number prefixes order folders and files and are stripped from URLs: `04-modules/auth/README.md` → `/docs/modules/auth/`                                                                                                                                                                                                                                                                                        |
| **Link rewriting**       | Relative link to another doc → its docs route (keep `#anchor`). Relative link to a code file → repo host URL (`…/blob/<docs-branch>/<path>` for files, `…/tree/…` for folders). External links unchanged                                                                                                                                                                                                       |
| **Heading anchors**      | GitHub-style slugs (github-slugger rules) so `#anchor` links match the Markdown view and the kit's verify script                                                                                                                                                                                                                                                                                               |
| **Navigation**           | Sidebar tree from the folder structure (folder `README` = folder title), previous/next in reading order, an on-page table of contents for h2–h3                                                                                                                                                                                                                                                                |
| **App look**             | Use the app's theme tokens, fonts and UI primitives. Match its lint and formatting rules and its file and naming conventions                                                                                                                                                                                                                                                                                   |

### Default features

All of these are on by default. Each can be dropped at checkpoint C.

| Feature                             | Implementation notes                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mermaid diagrams                    | Lazy-load mermaid (~1 MB) only on pages with a diagram. Use `securityLevel: 'strict'`. Render inside the diagram's own container so labels are measured with the same CSS; wait for `document.fonts.ready`. Put the theme in a per-diagram `%%{init: {"theme": …}}%%` directive so dark/light switching re-renders cleanly. On error, show the source and the message |
| Diagram zoom and drag               | For large diagrams: wheel/pinch zoom, drag to pan, reset button                                                                                                                                                                                                                                                                                                       |
| Code highlighting and a Copy button | Highlight at build time (prism, highlight.js or shiki). Add a Copy button to each `pre`                                                                                                                                                                                                                                                                               |
| Search                              | At build time, write a JSON index with one entry per h1–h3 section (page title, heading, anchor, plain text; drop diagram source and markers). Fetch it on first use and search it in the browser. Open with Ctrl/⌘+K and `/`. Results link to the heading anchor                                                                                                     |
| Floating Docs button                | App-wide, only when the flag is on. On click, save the current path to `sessionStorage`. On docs pages it becomes "Back to app" and returns to the saved path                                                                                                                                                                                                         |
| Dark mode                           | A toggle on docs pages, stored in `localStorage`. Wrap storage access in try/catch                                                                                                                                                                                                                                                                                    |
| "To confirm" pill                   | Style `span.docs-review` as a small dashed pill with its `title` as the tooltip. Strip it from the search index                                                                                                                                                                                                                                                       |
| Reading time, "View source" link    | Reading time per page and in the sidebar. A link to the page's Markdown on the repo host                                                                                                                                                                                                                                                                              |

### Library notes

- **Prefer what's already in the lockfile.** Check compatibility with the
  project's **Node version and module system**. Recent `unified`, `remark-*` and
  `rehype-*` releases are ESM-only. A CommonJS build or an old Node needs older
  majors or the framework's own Markdown plugins.
- **Typical pipeline:** `gray-matter` → `remark-parse` → `remark-gfm` → custom
  link/mermaid plugin → `remark-rehype` (`allowDangerousHtml`, so the review
  markers and `<details>` survive) → `rehype-raw` → `rehype-slug` → highlighter
  → `rehype-stringify`. Build the table of contents from the heading nodes.
- **Mermaid placeholder:** in the custom plugin, turn ` ```mermaid ` blocks into
  `<div class="docs-mermaid">escaped source</div>` **before** the highlighter
  runs, so they aren't highlighted.
- **The HTML is trusted build output** from the repo's own files. Render it with
  the framework's raw-HTML API: React `dangerouslySetInnerHTML`, Vue `v-html`,
  Svelte `{@html}`. Angular sanitizes `[innerHTML]` and needs
  `DomSanitizer.bypassSecurityTrustHtml`. Say so in the plan.

### The manifest (all recipes)

At build time, produce:

- the **tree** (folders, pages, titles, descriptions, order, reading time);
- the **reading sequence** (depth-first; previous/next);
- **per-page data:**
  `{ slug, title, description, html, toc, timeToRead, sourceUrl, previous, next }`;
- the **search index**.

## 2. Recipes

### Gatsby

| Piece     | Implementation                                                                                                                                                                                                                                                                                                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flag      | Read the environment config in `gatsby-config.js`. Add the docs plugins and the `gatsby-node` exports only when it's on. If the app's merged config file is generated in `onPreInit`, it doesn't exist yet when `gatsby-config.js` runs, so merge the source config files yourself                                                                                  |
| Source    | `gatsby-source-filesystem` (`name: 'docs'`, `path: docs/`) plus `gatsby-transformer-remark`. Its plugins, in order: a local remark plugin (link rewrite + mermaid placeholder), `gatsby-remark-autolink-headers`, `gatsby-remark-prismjs`                                                                                                                           |
| Pages     | `onCreateNode` adds `slug`, `order`, `published` and `dirSegments` fields. `createPages` queries the published nodes, builds the tree and sequence, writes the search index to `public/docs/search-index.json`, and creates one page per doc with `{ html, tableOfContents, timeToRead, tree, previous, next, sourceUrl }` in `pageContext`. No page queries needed |
| Routes    | Docs are static pages. Make sure `/docs/*` isn't captured by `gatsby-plugin-create-client-paths` or a catch-all route                                                                                                                                                                                                                                               |
| Auth      | Wrap the docs layout in the app's auth route component                                                                                                                                                                                                                                                                                                              |
| UI        | `src/components/Docs/`: `DocsLayout` (nav, pager, search, theme toggle), `DocsPage`, `DocsHomePage`, `DocsMarkdown` (diagrams, copy, pan/zoom), `DocsButton` mounted in the main layout                                                                                                                                                                             |
| Stay with | Plain Markdown and `gatsby-transformer-remark`. Avoid MDX, so the docs stay readable in the repo host                                                                                                                                                                                                                                                               |

### Next.js (App Router)

| Piece        | Implementation                                                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loader       | `lib/docs/` (server-only): read `docs/` with `fs`, run the unified pipeline, build the manifest and cache it per build                                                |
| Routes       | `app/docs/layout.tsx` (sidebar, search, theme) and `app/docs/[[...slug]]/page.tsx`. `generateStaticParams` comes from the manifest                                    |
| Flag         | A server-only env var (`DOCS_ENABLED`). When it's off, `generateStaticParams` returns `[]` and the layout calls `notFound()`. Hide the Docs button                    |
| Auth         | Add `/docs/:path*` to the existing middleware matcher, or check the session in `app/docs/layout.tsx` the way other protected layouts do                               |
| Client code  | Mermaid, copy and search live in small `'use client'` components that use dynamic `import()`. Markdown libraries stay on the server and never reach the client bundle |
| Search index | A route handler at `app/docs/search-index.json/route.ts` marked static, or a file written by the loader into `public/` at build                                       |

### Next.js (Pages Router)

`pages/docs/[[...slug]].js` with `getStaticPaths` and `getStaticProps`, using
the same loader. When the flag is off, return `paths: []` and `notFound: true`.
For auth, follow the app's existing pattern (middleware, HOC or session check).

### Vite SPA (React or Vue)

| Piece  | Implementation                                                                                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build  | A small local Vite plugin (for example `docs-ui/vite-plugin-docs.js`) that exposes the virtual modules `virtual:docs-manifest` (tree, sequence) and `virtual:docs-page/<slug>` (page data), built with the unified pipeline. Add `docs/` to the dev server watcher and invalidate the modules on change. Emit the search index with `this.emitFile` in `generateBundle` |
| Flag   | `import.meta.env.VITE_DOCS_ENABLED`, set per mode (`.env.development`, `.env.qa`, …). The plugin does nothing when it's off. Register the route only inside `if (import.meta.env.VITE_DOCS_ENABLED === 'true')` with a lazy import, so the bundler drops the docs chunk                                                                                                 |
| Route  | React Router: `path="docs/*"` → `lazy(() => import('./docs/DocsRoot'))`, inside the existing protected route. Vue Router: `{ path: '/docs/:slug(.*)*', component: () => import('./docs/DocsRoot.vue'), meta: { requiresAuth: true } }`, using the app's existing guard and meta key                                                                                     |
| Render | React `dangerouslySetInnerHTML` / Vue `v-html` with the build-time HTML. Enhance diagrams and code blocks in an effect or `onMounted`                                                                                                                                                                                                                                   |

### Nuxt

Use Nuxt's own content module (`@nuxt/content`). It runs inside the app, so it
isn't an external site. Point its source at the repo-root `docs/` folder. The
config differs between major versions, so check the installed version's docs.
Then:

- **Route:** `pages/docs/[...slug].vue`.
- **Auth:** the app's route middleware.
- **Flag:** register the module conditionally in `nuxt.config`
  (`modules: [...(process.env.DOCS_ENABLED === 'true' ? ['@nuxt/content'] : [])]`),
  and guard the page.
- **Mermaid:** render through a custom prose component for code blocks.

If the module doesn't fit, use a server route with the unified pipeline, like
the SvelteKit recipe.

### SvelteKit

- **Data:** `src/routes/docs/[...slug]/+page.server.(js|ts)` loads the page from
  a server-only loader (the unified pipeline). Export `entries` from the
  manifest for prerendering.
- **Auth:** the existing `hooks.server` handle or a layout `load` check.
- **Flag:** a private env var. When it's off, the loader throws `error(404)`.
- **Render:** `{@html}`, with client enhancements in `onMount`.

### Angular

| Piece  | Implementation                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build  | The universal prebuild script (below) writes `src/generated/docs/` (manifest, pages, search index). Add that folder to `assets` only in the build configurations where docs are on (configurations can override `assets` in `angular.json`) |
| Flag   | `environment*.ts` (`docsEnabled`), swapped per configuration through `fileReplacements`                                                                                                                                                     |
| Route  | Add `{ path: 'docs', canActivate: [<existing auth guard>], loadChildren: () => import('./docs/docs.routes') }` only when `environment.docsEnabled` is on, so the lazy chunk is unused when off                                              |
| Render | Fetch page JSON over `HttpClient`. Bind `[innerHTML]` through `DomSanitizer.bypassSecurityTrustHtml`, because the content is trusted build output; say so in the plan. Run mermaid and copy buttons in `ngAfterViewInit`                    |

### Server-rendered apps (Django, Rails, Laravel, Express views, ASP.NET MVC, Spring MVC)

- **Route:** `/docs/<path>`, behind the existing auth middleware or decorator.
  Optionally restrict it to a staff or developer role.
- **Flag:** an environment setting. When it's off, the route isn't registered.
- **Render:** the ecosystem's CommonMark library with heading-id and TOC
  extensions:

  - Python: `markdown-it-py` or `Python-Markdown`;
  - Ruby: `commonmarker`;
  - PHP: `league/commonmark`;
  - Java: `flexmark`;
  - .NET: `Markdig`;
  - Node: `markdown-it` or unified.

  Cache the HTML and manifest at startup, or build them in a build step.

- **Layout:** extend the app's base layout or template.
- **Client features:** mermaid, search and copy ship as one small static JS file
  through the app's static asset pipeline.
- **Packaging:** make sure `docs/` is included in the deployed artifact (Docker
  `COPY`, packaging config) in the environments where it's enabled.

### Universal prebuild (any other SPA bundler: CRA, custom webpack/rollup/parcel/esbuild)

| Piece  | Implementation                                                                                                                                                                                                                         |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Script | `scripts/build-docs.js` (or `.mjs`) reads `docs/`, runs the unified pipeline and writes `src/generated/docs/manifest.json`, `src/generated/docs/pages/<slug>.json` and `public/docs/search-index.json`. Gitignore the generated output |
| Wiring | Run it before dev and build (`predev`/`prebuild` or a chained script). Add a `--watch` mode using `fs.watch` or the project's existing watcher                                                                                         |
| Flag   | The script writes nothing when the flag env var is off. The route is registered only behind the same flag (bundler `DefinePlugin`/env replacement), so the lazy chunk is never referenced                                              |
| Load   | Import the manifest. Load pages with a dynamic `import()` that has a static prefix (for example `` import(`../generated/docs/pages/${slug}.json`) ``), or `fetch` them from `public/`                                                  |

## 3. Integration checklist (before the report)

- [ ] **Flag on:** every published page renders, links and anchors work, and
      diagrams render in both themes.
- [ ] **Flag off:** no docs route, button or chunk. Check the build output for
      docs strings and the mermaid library.
- [ ] **Auth:** visiting `/docs/` signed out goes to login, like any other
      protected page.
- [ ] **No collisions:** whatever served the route or `docs` paths before (API
      docs, static files) still works, with the flag on and with it off.
- [ ] **Navigation:** sidebar order matches folder numbers; previous/next follow
      the reading order; the table of contents links scroll to their headings.
- [ ] **Search:** results land on the right heading.
- [ ] **App screens:** the Docs button doesn't cover fixed UI such as save bars
      or chat widgets; "Back to app" returns to the saved path.
- [ ] **Project checks:** the project's lint, formatter, tests and production
      build pass.
- [ ] **Docs:** the in-app setup is documented in `maintaining-docs.md`: flag
      location, how to add a page, and where the UI code lives.
