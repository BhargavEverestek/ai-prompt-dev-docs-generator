# Discovery: understanding the project

This is the method for building an accurate picture of the codebase before
writing anything. It stays read-only until checkpoint B.

## Orient (Phase 0)

1. **Read the instruction and contributor files, if there are any.** Look for
   `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.cursor/rules/`,
   `.github/copilot-instructions.md`, `README*`, `CONTRIBUTING*`, and any
   existing `docs/` or wiki folder. Treat them as hints to verify, not as facts.
   None of them is required. If none exist (common), skip this step: the steps
   below learn the same things from the code, config and git history. Note which
   AI instruction file exists (if any), for the "Documentation" section offered
   at checkpoint B.

   **If `docs/` already has files**, find out what it is before anything else:

   - Count the files and look at their types.
   - Look for a docs-site config next to it (`mkdocs.yml`,
     `docusaurus.config.*`, `.vitepress/`, `conf.py`, `_config.yml`).
   - Check whether CI publishes it (GitHub Pages and similar).
   - Check whether it's generated output (API reference).

   The answer feeds the required existing-docs question at checkpoint A.

2. **Find the repos in scope.** Start with this repo. Then look for related
   repos in four places:

   - sibling folders (`../*`);
   - git submodules and workspace packages;
   - API base URLs or GraphQL endpoints in config, which point to a backend
     repo;
   - org-scoped packages in the manifest (`@org/*` or internal registries),
     which are shared code that lives elsewhere.

   List what you found and which ones exist locally.

3. **Find the latest branch** in each repo. The default branch is not always the
   newest.

   ```bash
   git fetch --all --prune
   git branch -a
   git for-each-ref --sort=-committerdate --format='%(committerdate:short) %(refname:short)' refs/remotes | head
   git rev-list --left-right --count origin/main...origin/develop   # "behind ahead"
   ```

   Prefer the branch that the CI deploys to dev or QA from (check the CI files).
   If related repos must agree (for example a frontend and its API), document
   branches that match.

4. **Detect the project type and stack** from the manifests:

   | File                                                         | Ecosystem               |
   | ------------------------------------------------------------ | ----------------------- |
   | `package.json` (+ framework deps, `workspaces`)              | JavaScript / TypeScript |
   | `pyproject.toml`, `requirements*.txt`, `setup.py`            | Python                  |
   | `go.mod`                                                     | Go                      |
   | `pom.xml`, `build.gradle*`                                   | Java / Kotlin           |
   | `*.csproj`, `*.sln`                                          | .NET                    |
   | `Gemfile`                                                    | Ruby                    |
   | `composer.json`                                              | PHP                     |
   | `Cargo.toml`                                                 | Rust                    |
   | `pubspec.yaml`                                               | Flutter / Dart          |
   | `nx.json`, `turbo.json`, `lerna.json`, `pnpm-workspace.yaml` | Monorepo                |

   Classify the project as one of:

   - web frontend (SPA or SSR);
   - backend service or API;
   - server-rendered full-stack app;
   - library or SDK;
   - CLI;
   - mobile app;
   - infrastructure / IaC;
   - monorepo (classify each package).

   Use `delivery.md` to map the framework to a UI recipe.

5. **Find how it runs and ships.** Look at package scripts, `Makefile`,
   `Dockerfile` and compose files, CI pipelines (`.github/workflows`,
   `.circleci`, `.gitlab-ci.yml`, `Jenkinsfile`, `azure-pipelines.yml`), and any
   env file templates (`.env.example` and similar). Never open real env or
   secret files (SKILL.md rule 7).

## Explore (Phase 1)

### Every project

| Area                     | What to find                                                                                                                                                                               | Why the docs need it                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| Entry points             | Main file(s), app bootstrap, providers and wrappers                                                                                                                                        | Where the code starts executing                      |
| Routing / dispatch       | URL routes, API routes, resolvers, CLI commands, message handlers                                                                                                                          | "URL or call → code" tables                          |
| Folder structure         | Purpose of each top-level folder; naming conventions                                                                                                                                       | Folder tour                                          |
| Configuration            | Config files, env var **names** (from templates and the code that reads them, never real env files), how they merge, which one wins, per-environment or per-client variants, feature flags | Most "why does it behave differently in X" questions |
| Data access              | API client, queries/mutations, ORM/repositories, caches                                                                                                                                    | Data flow in every module page                       |
| Auth & permissions       | Login flow, roles/groups, permission checks and where they're enforced                                                                                                                     | Access rows in "where to change"                     |
| Shared code              | Components, hooks, utilities and services used in many places, **with importer counts**                                                                                                    | Change impact page                                   |
| Generated files          | What generates them and when (build hooks, codegen)                                                                                                                                        | So readers edit the source, not the output           |
| External/shared packages | Internal org packages, vendored code, important third-party libraries                                                                                                                      | Behaviour that lives outside the repo                |
| Build, test, deploy      | Commands, CI stages, environments, release/versioning                                                                                                                                      | Setup and deploy pages                               |
| Background work          | Cron jobs, queues, triggers, webhooks, scheduled functions                                                                                                                                 | Backend pages                                        |
| Error handling & logging | Where errors are caught, shown and logged                                                                                                                                                  | Gotchas                                              |

### Extra checks by project type

- **Web frontend**
  - Take the **module list from the app's navigation or menu config**, not from
    folder names. Modules should match what users see.
  - Trace one real page end to end: URL → route → page component → data hook or
    query → API → response → render.
  - Find the shared patterns: lists with filters and pagination, forms and
    validation, modals, permission-gated UI, theming.
- **Backend / API**
  - Trace one real request: router or resolver → handler → service → database or
    downstream call → response shaping.
  - Find every place you must touch to **add a field end to end** (schema,
    resolver, mapper, database, tests), and pick a worked example.
  - Note migrations, infrastructure templates, and async jobs or triggers.
- **Full-stack monorepo or several repos**
  - Map which frontend operation calls which backend handler. Search for the
    same operation, endpoint or event name on both sides.
  - Note settings that must agree across repos (env names, URLs, feature flags,
    schema versions).
- **Library / SDK**
  - Map the public API (exports), extension points, versioning and the release
    process.
- **CLI**
  - Map commands and flags, config file lookup, exit codes and output formats.
- **Mobile**
  - Map navigation, platform-specific code and bridges, build flavors, and store
    release steps.

### Useful techniques

```bash
# importer count for a shared module (repeat per candidate; keep the top 10–20)
git grep -l -E "from ['\"].*/Button['\"]|require\(['\"].*/Button['\"]\)" -- src | wc -l

# biggest and most data-heavy files: candidates for deep-dive pages
git ls-files 'src/**' | xargs wc -l | sort -rn | head -30
git grep -c -E "useQuery|useMutation|fetch\(|axios\.|http\." -- src | sort -t: -k2 -rn | head -20

# read a file from the latest branch without checking it out
git show origin/develop:src/path/to/file.js

# trace a frontend operation into the backend repo
git -C ../backend grep -n "getOrder"
```

Adapt the patterns to the language and the import style. Prefer `git grep` and
`git ls-files`: they skip ignored files, so they never search inside local env
or secret files. If you use `grep -r` or `rg`, exclude the secret patterns from
SKILL.md rule 7.

```bash
# which env variables the app reads (names only; no env file is opened)
git grep -h -o -E "process\.env\.[A-Z0-9_]+|os\.environ(\.get)?\(['\"][A-Z0-9_]+" | sort -u
```

### Record as you go (scratch notes, not in the repo)

- **Modules:** name, screens or entry points, main files, data calls,
  permissions.
- **Glossary:** domain words used everywhere in the code and UI, each with a
  one-line meaning.
- **Problems:** dead code, inconsistent handling, missing error handling,
  hard-coded values, security smells, mismatches between repos. Note each one
  with its file; don't fix it. These become Known issues.
- **Open questions:** anything that depends on code you can't read (other
  services, cloud setup, third-party behaviour). These become "to confirm"
  markers or checkpoint questions.
- **Deep-dive candidates:** complex shared components or handlers that need
  their own page.
