/* eslint-disable no-console */
// Shared helpers for the docs kit (check.js, verify.js, review.js).
// Plain CommonJS for Node 12+, no packages needed.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { parseFrontmatter } = require('./frontmatter');

const KIT_DIR = __dirname;
const CONFIG_FILE = path.join(KIT_DIR, 'docs-kit.config.json');
const SYNC_FILE = path.join(KIT_DIR, 'docs-kit.sync.json');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, data) =>
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);

const config = readJson(CONFIG_FILE);
const REPO_ROOT = path.resolve(KIT_DIR, config.root || '..');
const DOCS_DIR = path.join(REPO_ROOT, config.docsDir || 'docs');

// the docs repo has no prefix in `sources:`; other repos use "<name>:"
const repos = config.repos.map((repo) => {
  const envPath = repo.pathEnv && process.env[repo.pathEnv];
  return {
    ...repo,
    code: repo.code || [],
    cwd: repo.primary
      ? REPO_ROOT
      : path.resolve(REPO_ROOT, envPath || repo.path),
    ignore: repo.ignore || [],
  };
});
const primary = repos.find((repo) => repo.primary);
if (!primary || repos.filter((repo) => repo.primary).length > 1) {
  throw new Error('docs-kit.config.json: mark exactly one repo as "primary"');
}

const git = (cwd, args) =>
  execSync(`git ${args}`, { cwd, encoding: 'utf8', stdio: 'pipe' }).trim();

const tryGit = (cwd, args) => {
  try {
    return git(cwd, args);
  } catch (e) {
    return null;
  }
};

const lines = (output) => (output ? output.split(/\r?\n/).filter(Boolean) : []);

const isRepo = (repo) =>
  fs.existsSync(repo.cwd) &&
  tryGit(repo.cwd, 'rev-parse --is-inside-work-tree') === 'true';

// origin/<branch> when it exists (after a fetch), otherwise the local branch
const resolveRef = (cwd, branch) =>
  tryGit(cwd, `rev-parse --verify --quiet origin/${branch}`)
    ? `origin/${branch}`
    : branch;

const listMarkdown = (dir = DOCS_DIR) =>
  fs.readdirSync(dir, { withFileTypes: true }).reduce((files, entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return files.concat(listMarkdown(full));
    return /\.md$/i.test(entry.name) ? files.concat(full) : files;
  }, []);

const toPosix = (file) => file.replace(/\\/g, '/');

// splits "api:src/**" into the api repo's globs; unprefixed globs belong to
// the primary repo
const splitSources = (patterns) =>
  (patterns || []).reduce((acc, pattern) => {
    const match = String(pattern).match(/^([\w.-]+):(.+)$/);
    const repo = match && repos.find((r) => !r.primary && r.name === match[1]);
    const name = repo ? repo.name : primary.name;
    acc[name] = (acc[name] || []).concat(repo ? match[2] : pattern);
    return acc;
  }, {});

// [{ file, rel, title, sources: { <repo name>: [globs] }, body }]
const readDocs = () =>
  listMarkdown().map((file) => {
    const { body, data } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    return {
      body,
      file,
      rel: toPosix(path.relative(REPO_ROOT, file)),
      sources: splitSources(data.sources),
      title: data.title || null,
    };
  });

const readSync = () =>
  fs.existsSync(SYNC_FILE) ? readJson(SYNC_FILE) : { repos: {} };

const writeSync = (sync) => writeJson(SYNC_FILE, sync);

module.exports = {
  config,
  DOCS_DIR,
  git,
  isRepo,
  KIT_DIR,
  lines,
  primary,
  readDocs,
  readSync,
  REPO_ROOT,
  repos,
  resolveRef,
  toPosix,
  tryGit,
  writeSync,
};
