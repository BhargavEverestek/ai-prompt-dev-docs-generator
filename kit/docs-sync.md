---
description:
  Update the developer docs for code that changed since the last docs sync
  (targeted edits only)
---

Update the developer docs in `docs/` for code that changed since the docs were
last verified. Edit only what the changes affect. Never rewrite a page from
scratch.

`<kit>` below is the kit folder's path from the repo root, normally
`ai-prompt-dev-docs-generator/kit`. Replace it with the real path when the kit
is set up.

**Never open secret files.** Everything you read goes to your AI provider. Don't
read, diff, search inside or print:

- local or gitignored env files (`.env`, `.env.local`, `.env.*.local`);
- keys and certificates (`*.pem`, `*.key`, `*.p12`, `*.pfx`, `id_rsa*`);
- credential data files: a name containing `credential`, `secret` or
  `service-account` with a data or config extension (`.json`, `.yml`, `.yaml`,
  `.toml`, `.ini`, `.properties`, `.txt`, `.env`, or none), such as
  `secrets.yml`;
- other credential files (`*.tfvars`, `*.tfstate`, `.npmrc`, `.netrc`, `.aws/`,
  `.ssh/`).

Source code is always readable, whatever its name (`secrets.py`,
`CredentialsForm.jsx`). Skip the files above even when they appear in a diff.
Learn config from templates such as `.env.example` and from the code that reads
it. The full rule is in `ai-prompt-dev-docs-generator/SKILL.md`, rule 7.

## Steps

1. **Find what changed.** Run `node <kit>/check.js --fetch --json`.

   - If `errors` is not empty (commit not found, repo missing, no sync yet),
     stop and report.
   - If `affected` and every list in `unmapped` are empty, say the docs are up
     to date and stop.
   - For repos other than the primary one, read files from their branch with
     `git -C <repo path> show origin/<branch>:<path>`, not from the working
     tree, which may be on another branch.

2. **Read the diffs, not just the file names.** For each affected page, run
   `git -C <repo path> diff <range> -- <files>`. The range for each repo is in
   the check output. Skip changes that don't change behaviour (formatting,
   version bumps, renamed variables).

3. **Edit the affected pages in place.**

   - For each change that matters, fix only the rows, steps, diagram nodes or
     sentences that are now wrong or missing.
   - Keep each page's structure. Module pages keep their six sections (What it
     is · Screens → code · How it works · Where to change what · What your
     change affects · Gotchas).
   - Check every sentence you write against the code. The code is the source of
     truth.
   - In Known issues, delete the rows the change fixed and add rows for new
     problems (ID, issue, where, severity).
   - Keep existing "to confirm" markers unless the change answers their
     question. Add one to any new claim that depends on code you can't read.

4. **Handle unmapped code.** For each file in `unmapped`:

   - **It belongs to an existing page:** add a glob to that page's `sources:`
     (with the `<repo name>:` prefix for non-primary repos) and update the page
     if needed.
   - **It's a new module with no page:** list it in the report. Don't write a
     new page unless asked.
   - **It's renamed or deleted code:** fix any `sources:` glob that now matches
     nothing.

5. **Verify.** Run `node <kit>/verify.js` and fix every error. If the docs are
   rendered in the app, also run the app's build with the docs flag on.

6. **Record the sync.** Only when every affected page is updated and verify
   passes, run `node <kit>/check.js --update-sync`.

7. **Report**, briefly:

   - pages changed and why (one line each);
   - Known issues added or removed;
   - unmapped areas still without docs.

   Don't commit; the user reviews the diff first.

<!-- prettier-ignore -->
$ARGUMENTS
