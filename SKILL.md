---
name: ai-prompt-dev-docs-generator
description:
  AI prompt for any AI coding tool (also loadable as a Claude Code skill) that
  writes developer documentation for any codebase. Every claim is checked
  against the code. Output is Markdown in docs/ and, when the project's stack
  supports it, an in-app docs UI behind login and a per-environment feature
  flag. A built-in maintenance kit verifies the docs and maps later code changes
  to the pages they affect. Use when asked to create developer, onboarding or
  codebase docs, a documentation module inside the app, or to keep such docs up
  to date.
---

# Developer docs generator

You are writing developer documentation for the project in the current working
directory. The goal: a developer who reads the docs for about one day can work
on the project. They know what each part does, where to look when a requirement
arrives, and what a change will affect.

These instructions work in any AI coding tool that can read files and run
commands. This folder (the one containing this file, called **the prompt
folder** below) was copied into the project. It stays there and becomes
project-specific. Paths such as `references/…`, `kit/…` and `project-profile.md`
are relative to the prompt folder.

**The docs folder** is `docs/` by default. If the project already has a `docs/`
folder that these docs mustn't go into, the user picks another one (see _Before
you start_). Everywhere these instructions and references say `docs/`, use the
chosen folder: in page links, the kit config (`docsDir` and the ignore globs),
the in-app UI, `maintaining-docs.md` and the AI-instructions section.

## What you produce

| Output                                                                                              | When                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Markdown pages in `docs/`, checked against the code, each with `sources:` frontmatter               | Always                                                                                                                          |
| The maintenance kit, set up in place in `kit/`: config, sync record, update prompt                  | Always. It needs only Node 12+ and no packages. If Node isn't available, use the manual fallback in `references/maintenance.md` |
| A `maintaining-docs.md` page explaining how to keep the docs current                                | Always                                                                                                                          |
| `project-profile.md` in the prompt folder, filled in for this project                               | Always, after checkpoint B                                                                                                      |
| In-app docs UI that renders `docs/` inside the application                                          | Only when the stack supports it **and** the user approves at checkpoint C                                                       |
| A short "Documentation" section in the project's AI instructions file (`AGENTS.md`, `CLAUDE.md`, …) | When the user approves it at checkpoint B                                                                                       |

The Markdown files are always the source. The in-app UI is a renderer on top of
them. **Never** set up a third-party docs site or hosting (Docusaurus, GitBook,
ReadTheDocs, Notion, Confluence and the like). If the app can't host the docs,
deliver Markdown only.

## Rules

1. **The code is the source of truth.** Existing docs, READMEs and comments are
   hints. Check every claim against the code before writing it.
2. **Document the latest code.** Find the integration branch (often `develop`,
   not `master`/`main`) and document that branch. Read files from it with
   `git show origin/<branch>:<path>` when the working tree is on another branch.
   If related repos are on mismatched branches, stop and ask.
3. **Never overwrite, move or delete existing docs** without the user's explicit
   approval for that specific change (see _Before you start_).
4. **Don't change application behaviour.** Record problems in Known issues;
   don't fix them. Outside the docs folder and the prompt folder, the only
   changes allowed are:

   - the approved in-app UI;
   - optional package scripts and lint-ignore entries for the kit;
   - the approved AI-instructions section.

   Each must sit behind a flag or be inert tooling, and match the project's
   conventions.

5. **Every claim about behaviour links to the file that shows it** (relative
   links). If a claim depends on code you can't read, add a "to confirm" marker
   (see `references/page-templates.md`) instead of guessing.
6. **Short and plain.** Use tables before prose and numbered steps for flows.
   Aim for a 10–15 minute read per module page.
7. **No sensitive content.** Never copy secrets, keys, tokens, passwords,
   connection strings or personal data. Refer to config by its key and file, not
   its value. Ask before naming customers or clients found in config.
8. **Leave generated files alone.** Don't edit them, and describe the source
   they're generated from instead.
9. **Ask well.** Ask only what the code can't answer. Batch questions at the
   checkpoints, number them, and give a recommended default for each
   (`references/questions.md`).
10. **Don't commit or push unless asked.** Work on a dedicated docs branch once
    the user agrees to one.

## Workflow

Read each reference file when its phase starts, not all at once.

### Before you start: generated already? Existing docs?

Read `project-profile.md`, then look at the docs folder (`docs/` by default).

- **Status is "not generated yet" and `docs/` is missing or empty:** run the
  full workflow below.
- **Status is "not generated yet" but `docs/` already has files:** they weren't
  made with this prompt. Don't write anything yet.
  1. Look at what's there (read-only): hand-written developer docs, generated
     API reference (JSDoc, TypeDoc, Sphinx output), the source of a docs site
     (Docusaurus, MkDocs, VitePress config next to it), a GitHub Pages folder,
     or unrelated files.
  2. Ask the existing-docs question in `references/questions.md` → _Checkpoint
     A_, which is required in this case, even if the scope is clear. Show the
     file count and what the folder holds.
  3. Follow the answer: **adopt** the existing docs, **use another folder**, or
     **replace**. Only replace after a second, explicit confirmation that lists
     what will be removed.
  4. Record the choice and the docs folder in `project-profile.md`.
- **The profile is filled:** this project was documented before. Don't
  regenerate. Use the profile's decisions, and ask what the user wants:

  - **update for code changes:** follow `kit/docs-sync.md`;
  - **add pages** (a new module, a deep dive): Phase 1 for that area only, then
    Phases 3 and 5;
  - **change a decision** (for example, add the in-app UI later): the matching
    phase.

  Update the profile at the end.

### Phase 0: Orient (read-only)

Read `references/discovery.md` → _Orient_. Find the repos in scope, the latest
branch, the project type and the stack. Check that Node 12+ is available
(`node --version`) for the kit.

The project doesn't need any AI setup. If `AGENTS.md`, `CLAUDE.md` or similar
files are missing, that's normal: learn the project from the code, config and
git history.

**Checkpoint A.** Ask now using `references/questions.md` → _Checkpoint A_ in
two cases: the scope is unclear (which repos, which branch, audience), or the
docs folder already has files (always ask then). Otherwise continue.

### Phase 1: Explore (read-only)

Follow `references/discovery.md` → _Explore_ and the checklist for the project
type. Keep working notes in a scratch file outside the repo: module list,
request traces, shared code with importer counts, glossary terms, problems
found, and open questions.

### Phase 2: Propose, then wait

Read `references/delivery.md` (in-app UI or Markdown only) and the section sets
in `references/page-templates.md`. Send the proposal described in
`references/questions.md` → _Checkpoint B_:

- the page tree and module list;
- the delivery recommendation and the reason for it;
- the docs branch name;
- whether to add a "Documentation" section to the AI instructions file;
- the open questions.

**Checkpoint B.** Stop and wait for the go-ahead. Write nothing before it. Then
fill in `project-profile.md` with the answers and what you found. Set its status
to "generated on <date>" only at the end of Phase 5.

### Phase 3: Write the docs

Follow `references/page-templates.md`. Give every page `sources:` frontmatter as
you write it. Write the pages in this order: Getting started → Architecture →
codebase pages → Modules → backend/other repos → Known issues →
`maintaining-docs.md` (from `references/maintenance.md`).

When adopting existing docs, follow `references/page-templates.md` → _Adopting
existing docs_ instead of the folder layout. Before creating any file, check
whether it already exists. If it does, edit it in place (adopt) or ask; never
overwrite it silently.

If approved, add the "Documentation" section to the AI instructions file last,
using the template in `references/maintenance.md`.

### Phase 4: Set up the kit

Follow `kit/README.md`. The kit runs from where it is (`<prompt folder>/kit/`);
don't copy it elsewhere. Write its config for this project's repos and fill in
the update prompt. Nothing needs installing.

If Node isn't available, skip this phase. Write the fallback version of
`maintaining-docs.md` and record "manual (no Node)" in the profile.

### Phase 5: Verify

Run `node <kit>/verify.js` until it reports 0 errors, then record the sync
(`node <kit>/check.js --update-sync`). Also work through
`references/maintenance.md` → _Verify_, which covers what a script can't check:
every "where to change" row and every Known issue against the current code.
Without Node, use the manual checklist there.

### Phase 6: In-app docs UI (if chosen at checkpoint B)

Read `references/ui-recipes.md`. Pick the recipe for the detected stack.

**Checkpoint C.** Send the concrete plan and wait for approval. The plan covers:
route, flag and the environments it's enabled in, auth gate, files to add or
change, dependencies with exact versions, how docs are kept out of the build
when the flag is off, and the feature list.

Then build it and run the project's lint, tests and build with the flag on and
with it off. Record the UI's location and flag in `project-profile.md`.

### Phase 7: Report

Keep it short:

- pages written;
- the top Known issues;
- claims marked "to confirm" and who should answer them;
- anything you couldn't verify;
- how to view the docs (UI route and flag, or the `docs/` folder);
- the maintenance routine;
- the files changed outside `docs/`.

Remind the user to commit the prompt folder with the docs. It's now part of the
project.
