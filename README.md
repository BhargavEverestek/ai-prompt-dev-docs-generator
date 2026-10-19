# AI prompt: developer docs generator

Copy this folder into your project, point your AI coding tool at it, and it
writes developer documentation for the project. It works with any AI coding tool
that can read files and run commands in the repo: Claude Code, Cursor, GitHub
Copilot (agent mode), Windsurf, Codex, Cline and others.

The AI:

1. explores the codebase read-only;
2. asks only the questions the code can't answer;
3. proposes a page plan and waits for approval;
4. writes short, code-first Markdown pages and checks every claim against the
   code.

When the project's stack supports it, the AI also proposes an in-app docs UI:
the docs open inside the application, behind its login, enabled per environment
by a flag. Otherwise the output is Markdown files only. It never creates an
external docs site.

## Quick start

1. **Copy this whole folder into the root of your project.** Keep the name
   `ai-prompt-dev-docs-generator/`.
2. **Open the project in your AI coding tool** in agent mode (it needs file
   access and a terminal).
3. **Ask:**

   > Follow the instructions in `ai-prompt-dev-docs-generator/SKILL.md` to
   > create developer documentation for this project.

4. **Answer the questions** when the AI stops at a checkpoint. Each question has
   a recommended default.
   - **A:** scope, only if unclear. It's always asked if your project already
     has a `docs/` folder: adopt the existing docs, write to another folder, or
     replace (only after a second confirmation).
   - **B:** the page plan, in-app UI or Markdown, and the docs branch.
   - **C:** the in-app UI plan, if you chose the UI.
5. **Review the result and commit it,** including this folder. It's now part of
   your project.

**Requirements:** Git and Node 12+ (for the maintenance kit). Nothing gets
installed: the kit has no packages.

**Safe with existing content.** The AI writes nothing before you approve the
plan. It never overwrites existing docs, pages or instruction-file sections
without asking. If the app already uses the `/docs` URL (for example for API
docs), it proposes `/dev-docs/` for the in-app UI instead.

**Your code and secrets.** The generator works the way your AI coding tool
always does: the files the AI reads are sent to your AI provider to be
processed. The only difference is that it reads more of the project than a
normal coding session. So it fits any project where your team already uses an AI
coding tool. If your project doesn't use AI tools yet, check with your tech lead
first.

- **Secret files stay closed.** The AI never opens `.env` files, keys,
  certificates or credential files. It learns config from templates like
  `.env.example` and from the code that reads each setting.
- **No secrets in the docs.** Config is described by name and file, never by
  value.
- **The kit's scripts run locally.** They read the docs and call `git`
  (`git fetch` from your own remote with `--fetch`). They don't send your code
  anywhere.

For extra protection, you can also block secret files in your AI tool. For
example: `permissions.deny` rules such as `Read(./.env*)` in Claude Code's
`.claude/settings.json`, a `.cursorignore` file in Cursor, or content exclusion
in GitHub Copilot's settings. Check your tool's docs for the exact format.

Your project doesn't need any AI setup first. `AGENTS.md`, `CLAUDE.md`,
`.cursorrules` and similar files are read if they exist, and are not needed if
they don't.

## Generic when shared, specific once copied

The folder you receive is generic. After the AI runs in your project, these
files hold your project's details:

| File                       | Filled with                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| `project-profile.md`       | Repos, branches, stack, and your answers at the checkpoints (delivery, docs branch, naming rules) |
| `kit/docs-kit.config.json` | Your repos, branches, and code and ignore globs                                                   |
| `kit/docs-kit.sync.json`   | The commits the docs were last verified against                                                   |
| `kit/docs-sync.md`         | The update prompt, with your kit path filled in                                                   |

Run the AI again later and it reads `project-profile.md` first. It sees the docs
already exist, so it updates them, adds pages or changes a decision instead of
starting over.

**To share it again** with another project, share the original copy, not one
from a project where it has already run.

## What's inside

| Path                           | What it is                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SKILL.md`                     | The prompt: rules, phases, and checkpoints where the AI stops and asks                                                            |
| `project-profile.md`           | This project's profile. Empty until the AI fills it                                                                               |
| `references/discovery.md`      | How to understand a project: what to read, what to trace, what to record                                                          |
| `references/questions.md`      | What to ask at each checkpoint, with recommended defaults                                                                         |
| `references/delivery.md`       | When to propose the in-app UI and when to deliver Markdown only; stack detection                                                  |
| `references/page-templates.md` | Folder layout, section sets per project type, page templates, writing rules                                                       |
| `references/ui-recipes.md`     | In-app UI spec and recipes: Gatsby, Next.js, Vite (React/Vue), Nuxt, SvelteKit, Angular, server-rendered apps, universal prebuild |
| `references/maintenance.md`    | Keeping the docs current, the verify checklist, and the no-Node fallback                                                          |
| `kit/`                         | The maintenance kit. It runs from here, with no packages: check/verify/review scripts, git hooks, and the docs update prompt      |

## Keeping the docs current

After the docs exist, the routine is in your project's
`docs/01-getting-started/maintaining-docs.md`. In short:

1. Merge the integration branch into the docs branch.
2. Ask your AI tool to _"Follow
   `ai-prompt-dev-docs-generator/kit/docs-sync.md`"_, or run `/docs-sync` if you
   set it up as a command. It updates only the pages the change affected and
   runs the checks.
3. Review the diff and commit.

## Claude Code users

The quick start works as is. `SKILL.md` is also a valid Claude Code skill, but
Claude only discovers skills in `.claude/skills/`. Keep the folder at the
project root as above, so the kit paths and the other tools keep working.

## Design principles

- The code is the source of truth; every claim links to a file.
- Document the integration branch that's actually newest, not the default
  branch.
- Take modules from the app's navigation. Count the importers of shared code to
  build the change-impact page.
- Mark claims that depend on code the AI can't read as "to confirm" instead of
  guessing.
- The in-app UI stays out of the build when its flag is off.

## Changing this prompt (for the person who maintains the shared copy)

- Keep `SKILL.md` short. Put the detail in `references/`.
- Keep the shared copy generic: no product, client or company names, only
  made-up examples, and `project-profile.md` and the kit config left as
  templates.
- When a project teaches a new lesson, add it as a rule or a checklist item in
  the reference file it belongs to.
- When you change a kit script, test it against a real docs folder: `verify.js`
  should report 0 errors on good docs and catch planted mistakes (a broken link,
  a missing anchor, an empty marker, a stale glob, a bad diagram).
