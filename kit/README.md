# Docs maintenance kit

The kit verifies the docs and keeps them current. Every page lists the code it
describes in `sources:`, the kit records the commits the docs were last verified
against, and a check lists the pages whose code changed since then.

It needs **Node 12+ and nothing else**: no packages to install and no changes to
project files. It works in any project, even a non-JavaScript one, and no part
of it depends on a particular AI tool.

## Files

| File                                  | Purpose                                                                                         |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `docs-kit.config.json`                | Repos, branches, code and ignore globs, docs folder, docs branch                                |
| `docs-kit.sync.json`                  | Commits the docs were verified against. Written by `check.js --update-sync`                     |
| `check.js`                            | Pages affected since the sync, and changed code no page claims                                  |
| `verify.js`                           | Titles, links, anchors, `sources` globs, "to confirm" markers, and Mermaid syntax when possible |
| `review.js`                           | "To confirm" checklist for the owning team                                                      |
| `install-hooks.js`                    | Optional git hooks that run the check after merges and rebases on the docs branch               |
| `docs-sync.md`                        | The docs update prompt, for any AI coding tool (or to follow by hand)                           |
| `lib.js`, `glob.js`, `frontmatter.js` | Shared helpers: git, glob matching, frontmatter reading                                         |

## Set up (done by the AI in Phase 4, or by hand)

The kit runs **where it is**, inside the prompt folder that was copied into the
project. Don't copy or move it. Below, `<kit>` is its path from the repo root,
normally `ai-prompt-dev-docs-generator/kit`.

1. **Edit `docs-kit.config.json`:**

   | Key                        | Meaning                                                                                                                           |
   | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
   | `root`                     | Path from the kit folder to the repo root. `../..` when the prompt folder sits at the repo root                                   |
   | `docsDir`                  | The docs folder, relative to the root (`docs`, or the folder chosen instead, such as `dev-docs`). Put the same folder in `ignore` |
   | `docsBranch`               | The branch the docs are maintained on. The hooks only run there. Use `null` to run on every branch                                |
   | `repos[].name`             | Short name. Non-primary repos use it as the `sources:` prefix (`api:src/**`)                                                      |
   | `repos[].primary`          | `true` for the repo that holds the docs (exactly one). Its sources have no prefix                                                 |
   | `repos[].path` / `pathEnv` | Non-primary repos: path from the root (`../api`), and an optional env var that overrides it                                       |
   | `repos[].branch`           | The integration branch the docs describe (for example `develop`)                                                                  |
   | `repos[].code`             | Globs of code that should be documented somewhere. Changed files here that no page claims are reported as "unmapped"              |
   | `repos[].ignore`           | Globs whose changes never need a docs update. Keep the docs folder and the prompt folder in it, plus lockfiles and build output   |

   Globs support `*`, `**`, `?`, `{a,b}`, `[abc]` and a leading `!` to exclude.
   Paths use forward slashes.

2. **Fill in the update prompt.** In `docs-sync.md`, replace `<kit>` with the
   kit path. Any AI tool can follow it from there. To also run it as a
   `/docs-sync` command, copy it to the folder your tool uses (Claude Code,
   Copilot, Cursor, Windsurf). The table is in `../references/maintenance.md`.

3. **Make sure every page has `sources:`.** Use globs of the code each page
   describes. Overview pages at the top of `docs/` may have none.

4. **Verify, then record the first sync.** Once `node <kit>/verify.js` reports 0
   errors, run `node <kit>/check.js --update-sync` and commit
   `docs-kit.sync.json`.

**Optional:**

- **Package scripts**, if the project uses `package.json`:

  ```json
  "docs:check": "node ai-prompt-dev-docs-generator/kit/check.js",
  "docs:verify": "node ai-prompt-dev-docs-generator/kit/verify.js",
  "docs:review": "node ai-prompt-dev-docs-generator/kit/review.js"
  ```

- **Lint ignore:** if the project's linter or formatter scans every `*.js` or
  `*.md` in the repo, add the prompt folder to its ignore file.
- **Git hooks:** each maintainer runs `node <kit>/install-hooks.js` once.
- **Mermaid checks:** if the project already has `mermaid` and `jsdom` in its
  `node_modules`, `verify.js` uses them to check diagram syntax. Otherwise it
  warns that diagrams weren't checked. Don't install them just for this.
  Likewise, `github-slugger` is used for anchors when present, and a built-in
  equivalent otherwise.

## How the check decides

- **Primary repo:** the diff runs from the synced commit to the merge-base of
  `HEAD` and the integration branch. Commits made only on the docs branch are
  never reported as code changes.
- **Other repos:** the diff runs from the synced commit to `origin/<branch>`, or
  to the local branch when there's no remote.
- **Results:** a changed file matching a page's `sources:` → that page is
  "affected". A changed file matching `code` but no page → "unmapped".
