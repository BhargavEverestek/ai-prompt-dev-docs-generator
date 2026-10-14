# Questions and checkpoints

## How to ask

- Ask only what the code, config or git history can't answer. If you can find
  it, find it.
- Batch questions at a checkpoint. Don't drip them one by one.
- Number the questions and keep one decision per question. Give a **recommended
  default** for each, so the user can answer "defaults" or with a list of
  numbers.
- Show what you found that led to the question ("`develop` is 212 commits ahead
  of `master`").
- If an interactive question tool is available (for example `AskUserQuestion`),
  use it for choices with 2–4 options. Put free-form items in plain text.

## Checkpoint A: scope (Phase 0)

Ask the scope questions only when unclear. Always ask the existing-docs question
when the docs folder already has files.

0. **Existing docs** (required when `docs/` already has files). Show the file
   count, a few example paths, and what the folder holds. Then ask:

   - **Adopt.** Keep the existing pages and their structure. Add frontmatter and
     `sources:`, fix what the code contradicts, and write new pages only for the
     gaps. _Default when they're hand-written developer docs._
   - **Use another folder.** Write these docs to a new folder and leave `docs/`
     untouched. _Default when `docs/` holds generated API reference, a docs-site
     source, a GitHub Pages site, or unrelated files._ Suggest `dev-docs/`, or
     `developer-docs/` if that name is also taken.
   - **Replace.** Write fresh docs into `docs/`, removing what's there. Never
     the default. If chosen, list exactly what will be removed and ask a second
     time. Mention that git history keeps the old files.

   Also warn when writing into `docs/` would publish the pages somewhere, for
   example a docs site or GitHub Pages built from that folder.

1. **Repos in scope** and their local paths. _Default: this repo plus the
   related repos found locally._
2. **Branch to document** in each repo. _Default: the most recently updated
   integration branch, usually `develop`._
3. **Audience.** _Default: developers new to the project._ Other options:
   QA/support, or also business readers. Those readers get a short "What it
   does" section per module, and the rest stays code-first.
4. **Language** of the docs. _Default: English._

## Checkpoint B: the proposal (end of Phase 2)

Send this as one message, then wait.

1. **Page tree:** the docs folder, then its folders and pages, with one line per
   page. When adopting existing docs, mark each page as _kept_, _updated_ or
   _new_. Never plan to remove or rename an existing page without saying so
   here.
2. **Module list:** where it came from (nav config, routes, packages), with one
   line per module.
3. **Delivery:**
   - In-app UI is supported → "Recommend in-app docs at `/docs/` behind login,
     enabled per environment by a flag (because …). Or Markdown only?" If the
     app already uses `/docs` (API docs, static files, an existing page), say
     what uses it and propose `/dev-docs/` instead.
   - Not supported → "Markdown only, because …". Don't offer an external site.
4. **Docs branch.** _Default: create `docs/developer-docs` from
   `<latest branch>`._ If that branch already exists, say so and propose another
   name.
5. **AI instructions file.** Say which one exists (`AGENTS.md`, `CLAUDE.md`,
   `.github/copilot-instructions.md`, a Cursor rule) or that there's none.
   _Default: add a short "Documentation" section to it, or create `AGENTS.md` if
   there's none._ If it already has a documentation section, propose updating
   that section instead of adding a second one.
6. **Sensitive names.** Show the customer or client names, account IDs or
   internal hosts found in config. _Default: refer to them generically ("client
   variant A")._
7. **Code you can't read:** list it (other services, cloud setup). _Default:
   write what the visible code shows and mark the rest "to confirm" for the
   owning team._ Ask who that team is.
8. **Deep dives:** list the complex components or handlers you'd give their own
   page. _Default: the top 5–10 by complexity and importer count._
9. **Only if Node 12+ isn't available:** say the kit can't run, so docs
   verification and updates will be manual. _Default: install Node if possible;
   otherwise use the manual fallback._
10. Any other open questions from exploring.

The maintenance kit isn't a question: it's always set up. It only needs Node,
installs nothing, and changes no project files.

## Checkpoint C: the in-app UI plan (start of Phase 6)

Send the plan, then wait for approval.

- **Recipe** used and why (detected stack and version).
- **Route** (default `/docs/`) and the **auth gate** it sits behind. Show that
  the route is free: what you searched (routes, server routes, rewrites, API
  docs, static `docs` folders) and that nothing uses it. Otherwise use
  `/dev-docs/`.
- **Flag:** where it lives and which environments enable it. _Default: dev and
  QA on, production off._
- **Build exclusion:** how the docs and their libraries stay out of the build
  when the flag is off.
- **Files** to add, and existing files to change, with one line each.
- **Dependencies:** name and exact version. Prefer versions already in the
  lockfile, and check that they're compatible with the project's Node version
  and module system.
- **Features:** the default set from `ui-recipes.md`, plus any you'd drop and
  why.

## Ask during the work only when

- the code and existing docs contradict each other and both look intentional;
- documenting something would need an app-code change;
- a command needs network access, credentials or a package install that wasn't
  approved;
- a verify error can only be fixed by changing app code.
