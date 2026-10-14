# Page templates and writing rules

## Folder layout

```
docs/
  README.md                     (Markdown only) reading order; the in-app UI has its own home page
  01-getting-started/
    README.md                   what the project is, reading path, glossary
    local-setup.md              install, run, test, branches → environments
    maintaining-docs.md         how to keep these docs current (see maintenance.md)
  02-architecture/
    README.md                   system diagram, one request traced end to end
    environments.md             environments, variants, settings that must agree across repos
    key-libraries.md            libraries that shape the code, and shared/internal packages
  03-<app-name>/                one folder per app or repo in scope
    README.md                   folder tour, anatomy of one real page or request
    where-to-look.md            requirement → files to touch, in order
    change-impact.md            shared code → what it affects → what to watch
    components/                 deep dives on complex shared components or handlers
  04-modules/
    README.md                   module index (one line each)
    <module>/README.md          one page per module, always the six sections below
  05-<backend-name>/            backend or other repo sections, when in scope
  06-known-issues/
    README.md
```

`docs/` is the chosen docs folder (see SKILL.md). A number prefix (`01-`) sets
the order of folders and files. Strip the number from URLs and titles.
`README.md` is a folder's index page.

This layout is for new docs. When adopting existing docs, follow _Adopting
existing docs_ below instead.

### Section sets by project type

| Project type                               | Sections                                                                                                                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web frontend + backend (one or more repos) | All of the above                                                                                                                                                                                |
| Web frontend only                          | Getting started, Architecture, App, Modules, Known issues                                                                                                                                       |
| Backend / API only                         | Getting started, Architecture, Codebase (dispatch → handler → service → data), Modules (by domain or resource), API change guide ("add a field"), Background jobs, Build & deploy, Known issues |
| Server-rendered full stack                 | Same as frontend + backend, in one codebase section                                                                                                                                             |
| Library / SDK                              | Getting started, Architecture (public API, internal layers), Modules (one per public entry point or area), Extending, Release & versioning, Known issues                                        |
| CLI                                        | Getting started, Architecture, Modules (one per command group), Configuration, Release, Known issues                                                                                            |
| Mobile                                     | Getting started (per platform), Architecture, Modules (screens or features), Native code and bridges, Build flavors & release, Known issues                                                     |
| Monorepo                                   | Getting started, Architecture (package graph diagram), one section per package using the matching type, Known issues                                                                            |

## Frontmatter (every page)

```yaml
---
title: Orders # required; pages without a title aren't published in the UI
description: One sentence for the page.
order: 10 # optional; sorts pages inside a folder
sources: # globs of the code this page describes; the kit maps code changes to pages with them
  - 'src/features/orders/**'
  - 'api:src/handlers/order*.js' # '<repo name>:' prefix for repos other than the docs repo
---

```

## Adopting existing docs

Use this when the user chose **adopt** at checkpoint A. The existing pages
belong to the team, so improve them without taking them over.

- **Keep the structure.** Don't rename, move, renumber or delete existing files
  or headings unless the user approved that change at checkpoint B. Other pages,
  bookmarks and links point at them.
- **Add frontmatter** (`title`, `description`, `sources:`) to pages that lack
  it. Where a page already has frontmatter, add only the missing keys and keep
  the rest.
- **Correct, don't rewrite.**
  - Fix statements the code contradicts.
  - Mark claims you can't verify as "to confirm".
  - Leave correct prose in its own style, even if it differs from these
    templates.
- **Fill gaps with new pages** that use the templates below. Put them where they
  fit the existing structure, not in a parallel numbered tree.
- **Add the missing core pages if they don't exist:** Where do I look, Change
  impact, Known issues, and `maintaining-docs.md`. Use the existing naming
  style.
- **Leave non-Markdown files and generated output alone.**
- **Report what you changed per page,** so the owners can review it.

## Templates

### Getting started (`01-getting-started/README.md`)

- **What it is:** 3–5 sentences of business context, then one table with the
  columns _Part/repo · What it does · Tech · Where it runs_.
- **Reading path:** a numbered list of pages, each with a time estimate. The
  total should be about one day.
- **Glossary:** a table of _Term · Meaning · Where you see it in code_.

### Architecture (`02-architecture/README.md`)

- One Mermaid diagram of the whole system: apps, APIs, data stores and external
  services.
- One real request traced end to end as a sequence diagram, followed by numbered
  steps with a file link on each step.
- Environments and variants: which config wins, and the settings that must agree
  across repos.

### Codebase section (`03-<app>/README.md`)

- **Folder tour:** a table of _Folder · Holds · Naming convention_.
- **Anatomy of one real page or request:** URL or call → route → component or
  handler → data → API, with a link on every step.
- **Shared patterns:** lists and filters, forms and validation, permissions,
  config-driven behaviour, errors. For each pattern, give one example file.

### Where do I look (`where-to-look.md`)

| I need to…                           | Files, in order                                      |
| ------------------------------------ | ---------------------------------------------------- |
| Add a column to a list screen        | 1. query file → 2. list component → 3. column config |
| Add a form field                     | …                                                    |
| Change who can access X              | …                                                    |
| Change an email/message              | …                                                    |
| Change behaviour for one environment | …                                                    |

### Change impact (`change-impact.md`)

| Shared file                                          | Used by (count) | What it affects              | Watch for                | Find usages                         |
| ---------------------------------------------------- | --------------- | ---------------------------- | ------------------------ | ----------------------------------- |
| [`AppShell`](../../src/components/AppShell/index.js) | 48              | every page's auth and layout | redirects, layout choice | `git grep -l "components/AppShell"` |

End the page with a **pre-push checklist**: lint, tests, the screens to click
through, and the environments or variants to check.

### Module page (`04-modules/<module>/README.md`)

Every module page has these six sections, in this order. Keep the headings
exactly the same on every page, so readers learn the shape once.

```md
## What it is

2–4 sentences: what users do here and why it matters.

## Screens → code

| Screen / URL | Component | Data (query/endpoint) | Permission |

## How it works

One Mermaid diagram, then numbered steps with a file link on each.

## Where to change what

| Requirement | Files, in order |

## What your change affects

Shared code this module uses, and other modules that depend on this one.

## Gotchas

Bullets; link to rows in Known issues
(`../../06-known-issues/README.md#<area>`).
```

Put long reference tables (every field, every endpoint) inside
`<details><summary>…</summary>…</details>`.

### Backend "add or change an API field" (`add-api-field.md`)

Number every place you must touch, in order: schema → resolver or handler →
mapper or serializer → data store/migration → tests → frontend query. Then walk
through a **worked example** with a real field and real file links.

### Deep-dive component page (`components/<name>.md`)

The sections are:

- What it is and where it's used (importer count).
- Inputs or props.
- How it works (diagram plus steps).
- How to extend it.
- Gotchas.

### Known issues (`06-known-issues/README.md`)

Write one `##` section per area, each with one table.

| ID  | Issue                                                              | Where                                              | Severity |
| --- | ------------------------------------------------------------------ | -------------------------------------------------- | -------- |
| OR1 | Order total is rounded differently in the list and the detail view | [`format.js`](../../src/features/orders/format.js) | Medium   |

IDs use an area prefix plus a number. Keep IDs stable and never reuse one.
Severity is _High_ (data loss, security, broken flow), _Medium_ (wrong behaviour
with a workaround) or _Low_ (cleanup).

## Writing rules

- **Length:** a module page is about 150–200 lines, a 10–15 minute read. Split
  anything longer.
- **Format:** tables before prose; numbered steps for flows; short sentences in
  the active voice.
- **Context:** 3–5 sentences of business context per page. The rest is about the
  code.
- **Links:** link every behaviour claim to its file with a relative link from
  the page. Link to a heading with `#anchor` only when that heading exists.
- **Terms:** use the glossary's terms the same way everywhere.
- **Mermaid:**
  - At most one diagram per page, and only where it helps.
  - About 15 nodes at most.
  - Quote labels (`A["Load order"]`) and use `<br/>` for line breaks.
  - Keep node IDs alphanumeric.
- **Claims you can't verify** (they depend on code you can't read) get this
  marker. Keep it on one line, exactly in this form, with a non-empty question:

  ```text
  Updating an order creates a new revision <span class="docs-review" title="When does the orders service create a new revision?">to confirm</span>.
  ```

  The in-app UI shows it as a small "to confirm" pill. The kit's review script
  collects these markers into a checklist for the owning team.

- **Never** include secrets, keys, tokens, passwords, connection strings,
  personal data or real customer records.
