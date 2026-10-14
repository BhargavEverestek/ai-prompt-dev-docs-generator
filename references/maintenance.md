# Keeping the docs current

Docs go stale when code merges and nobody maps the change to the pages it
affects. The kit does that mapping: every page lists the code it describes in
`sources:`, and a check names the pages whose code changed since the docs were
last verified.

Write this guide into the project as
`docs/01-getting-started/maintaining-docs.md`, with real branch names, paths and
commands. Use the fallback section at the end only when Node isn't available.

## Rules

- **Docs branch.** Keep docs work on a dedicated branch (for example
  `docs/developer-docs`). Merge the integration branch into it regularly. The
  docs describe the code as merged into that branch.
- **When to update:** after merging the integration branch, before a release,
  and when a new module appears.
- **How to update:**
  - Make targeted edits. Never rewrite a page from scratch.
  - Read the diffs, not just the changed file names.
  - Skip changes that don't change behaviour: formatting, version bumps,
    renames.
  - Keep each page's structure. Module pages keep their six sections.
  - In Known issues, delete rows the change fixed and add rows for new problems.
  - Keep "to confirm" markers until the owning team answers them.
  - Check every sentence you write against the code.
- **Record what you verified against.** Only after the pages are updated and
  verified, record the sync.

## The kit

It needs Node 12+ and nothing else: no packages and no changes to project files.
The scripts don't depend on any AI tool.

| Part                                  | What it does                                                                                                                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sources:` in each page's frontmatter | Globs of the code the page describes (`<repo>:` prefix for other repos), so changed files map to pages                                                                                |
| `docs-kit.config.json`                | Repos (name, path, branch, code globs, ignore globs), docs folder, docs branch                                                                                                        |
| `docs-kit.sync.json`                  | The commit of each repo the docs were last verified against                                                                                                                           |
| `check.js`                            | Lists the pages affected by code merged since the sync, plus changed code no page claims                                                                                              |
| `verify.js`                           | Checks titles, relative links, `#anchors`, `sources` globs and "to confirm" markers. Exits 1 on errors. Also checks Mermaid syntax if the project has `mermaid` and `jsdom` installed |
| `review.js`                           | Collects "to confirm" markers into a checklist for the owning team                                                                                                                    |
| `install-hooks.js`                    | Optional git `post-merge`/`post-rewrite` hooks that run the check on the docs branch                                                                                                  |
| `docs-sync.md`                        | The update prompt, for any AI coding tool in agent mode (or to follow by hand)                                                                                                        |

**Routine**

1. Merge the integration branch into the docs branch. If the hooks are
   installed, they print the affected pages.
2. Run the update prompt: ask any AI tool to _"Follow
   `ai-prompt-dev-docs-generator/kit/docs-sync.md`"_, or run `/docs-sync` if you
   set it up as a command. It reads the diffs, edits only the affected sections,
   updates Known issues, runs verify and records the sync.
3. Review the diff and commit.

**Commands.** `<kit>` is `ai-prompt-dev-docs-generator/kit`. Package scripts for
these are optional.

| Command                                  | Does                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------- |
| `node <kit>/check.js [--fetch] [--json]` | Affected pages and unmapped code since the sync                      |
| `node <kit>/verify.js`                   | Static checks; exit code 1 on errors                                 |
| `node <kit>/check.js --update-sync`      | Records the current commits. Run it only after the pages are updated |
| `node <kit>/review.js [--md]`            | "To confirm" checklist                                               |
| `node <kit>/install-hooks.js`            | Installs the git hooks, once per developer                           |

**Making the update prompt a command in your AI tool** (optional). Keep the
original in the kit folder, and add a copy where your tool looks for reusable
prompts. Then `/docs-sync` runs it:

| Tool                     | Copy `docs-sync.md` to                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| Claude Code              | `.claude/commands/docs-sync.md`                                          |
| GitHub Copilot (VS Code) | `.github/prompts/docs-sync.prompt.md`                                    |
| Cursor                   | `.cursor/commands/docs-sync.md`                                          |
| Windsurf                 | `.windsurf/workflows/docs-sync.md`                                       |
| Any other tool           | No copy. Ask: _"Follow `ai-prompt-dev-docs-generator/kit/docs-sync.md`"_ |

These folder conventions change between tool versions, so check your tool's
docs. The last line, `$ARGUMENTS`, is Claude Code syntax: other tools show it as
plain text, so delete it in their copies.

## "Documentation" section for the AI instructions file (if approved)

This section lets future AI sessions in any tool find and maintain the docs. Add
it to the project's existing AI instructions file (`AGENTS.md`, `CLAUDE.md`,
`.github/copilot-instructions.md`, a Cursor rule). If none exists, create
`AGENTS.md`, which most AI coding tools read. If the file already has a section
about docs, update that section instead of adding a second one. Keep it this
short, using the real docs folder and paths:

```md
## Documentation

Developer docs live in `docs/` (start at `docs/01-getting-started/README.md`).
Before changing a module, read its page in `docs/04-modules/`. The code is the
source of truth; if a page disagrees with the code, say so. To update the docs
after code changes, follow `ai-prompt-dev-docs-generator/kit/docs-sync.md`.
```

## Verify (Phase 5, and after every update)

Run `node <kit>/verify.js` until it reports 0 errors. Then check what a script
can't:

- [ ] each "where to change" row names the right files in the right order;
- [ ] each Known issue still exists in the current code;
- [ ] no page contains secrets or personal data;
- [ ] page lengths stay in the target range (split long pages);
- [ ] diagrams render, if `verify.js` warned that it couldn't check them (repo
      host preview or the editor's Markdown preview);
- [ ] with the in-app UI, the project build passes with the flag on and off.

## Fallback: no Node available

Use this only when Node can't be installed. Keep `sources:` on every page
anyway: it still shows which code each page describes.

Put a table in `maintaining-docs.md`, and update it at the end of every docs
update:

```md
## Last verified against

| Repo | Branch  | Commit   | Date       |
| ---- | ------- | -------- | ---------- |
| app  | develop | 1a2b3c4d | 2026-01-31 |
```

**Routine**

1. **List what changed** in each repo since the recorded commit:
   `git log --oneline <commit>..origin/<branch>` and
   `git diff --stat <commit>..origin/<branch> -- . ':!docs'`.
2. **Map changed files to pages:** compare them with each page's `sources:`, or
   search the docs (`git grep -n -F "<path>" -- docs/`).
3. **Edit the affected sections**, following the rules above.
4. **Verify by hand:**
   - links and `#anchors` resolve;
   - diagrams render;
   - the rows you touched name files that exist;
   - plus the checklist above.
5. **Update the "Last verified against" table** and commit.

In the AI instructions section, the last line becomes: _To update the docs after
code changes, follow `docs/01-getting-started/maintaining-docs.md`._
