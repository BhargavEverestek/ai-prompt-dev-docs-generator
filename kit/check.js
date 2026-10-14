#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Lists the docs pages affected by code changes since the last docs sync.
 *
 *   node <kit>/check.js                 diff every repo since docs-kit.sync.json
 *   node <kit>/check.js --fetch         git fetch the repos first
 *   node <kit>/check.js --json          machine-readable output (used by docs-sync)
 *   node <kit>/check.js --update-sync   record the current commits as verified
 *   node <kit>/check.js --from-hook <hook> [args]   used by the git hooks
 *
 * The primary (docs) repo is diffed up to its merge-base with the integration
 * branch, so the docs branch's own commits are never reported as code changes.
 */

const glob = require('./glob');
const {
  config,
  isRepo,
  lines,
  primary,
  readDocs,
  readSync,
  REPO_ROOT,
  repos,
  resolveRef,
  tryGit,
  writeSync,
} = require('./lib');

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const short = (sha) => (sha ? sha.slice(0, 8) : '?');

// the commit each repo is compared up to
const headOf = (repo) => {
  const ref = resolveRef(repo.cwd, repo.branch);
  if (!repo.primary) {
    return { label: ref, sha: tryGit(repo.cwd, `rev-parse ${ref}`) };
  }
  const sha = tryGit(repo.cwd, `merge-base HEAD ${ref}`);
  return { label: `${ref} as merged into HEAD`, sha };
};

const repoState = (repo, synced) => {
  if (!isRepo(repo)) {
    return { error: `${repo.name}: no git repo at ${repo.cwd}` };
  }
  const head = headOf(repo);
  if (!head.sha) {
    return { error: `${repo.name}: branch ${repo.branch} not found` };
  }
  if (!synced || !synced.commit) {
    return {
      error: `${repo.name}: no sync commit yet; run --update-sync once the docs are verified`,
      head,
    };
  }
  // cat-file -t avoids ^{commit}, which cmd.exe mangles on Windows
  if (tryGit(repo.cwd, `cat-file -t ${synced.commit}`) !== 'commit') {
    return {
      error: `${repo.name}: commit ${short(
        synced.commit
      )} not found (try --fetch)`,
      head,
    };
  }
  const changed = lines(
    tryGit(repo.cwd, `diff --name-only ${synced.commit} ${head.sha}`)
  );
  return {
    changed: glob.notMatch(changed, repo.ignore).sort(),
    head,
    range: `${short(synced.commit)}..${short(head.sha)} (${head.label})`,
  };
};

// git hooks call this; only react on the docs branch, and to rebases (not amends)
const shouldRunFromHook = () => {
  const [hook, kind] = args.slice(args.indexOf('--from-hook') + 1);
  const branch = tryGit(REPO_ROOT, 'rev-parse --abbrev-ref HEAD');
  if (config.docsBranch && branch !== config.docsBranch) return false;
  if (hook === 'post-rewrite' && kind !== 'rebase') return false;
  console.log(`\n== Docs check after ${hook} on ${branch} ==`);
  return true;
};

const updateSync = (sync) => {
  const next = { ...sync, repos: { ...sync.repos } };
  repos.forEach((repo) => {
    if (!isRepo(repo)) {
      console.log(`! ${repo.name}: no git repo at ${repo.cwd}, not recorded`);
      return;
    }
    const { sha } = headOf(repo);
    next.repos[repo.name] = { branch: repo.branch, commit: sha };
    console.log(`${repo.name}: ${short(sha)}`);
  });
  next.verifiedAt = new Date().toISOString().slice(0, 10);
  writeSync(next);
  console.log('docs-kit.sync.json updated');
};

const main = () => {
  if (has('--from-hook') && !shouldRunFromHook()) return;

  if (has('--fetch')) {
    repos.forEach((repo) => {
      if (isRepo(repo)) tryGit(repo.cwd, `fetch origin ${repo.branch}`);
    });
  }

  const sync = readSync();
  if (has('--update-sync')) {
    updateSync(sync);
    return;
  }

  const states = {};
  repos.forEach((repo) => {
    states[repo.name] = repoState(repo, sync.repos[repo.name]);
  });

  const docs = readDocs().filter((doc) => doc.title);
  const claimed = {};
  repos.forEach((repo) => {
    claimed[repo.name] = new Set();
  });

  const affected = docs
    .map((doc) => {
      const files = {};
      repos.forEach((repo) => {
        const globs = doc.sources[repo.name] || [];
        const changed = states[repo.name].changed || [];
        const hits = globs.length ? glob.match(changed, globs) : [];
        hits.forEach((file) => claimed[repo.name].add(file));
        if (hits.length) files[repo.name] = hits;
      });
      return { files, page: doc.rel, title: doc.title };
    })
    .filter((doc) => Object.keys(doc.files).length);

  const unmapped = {};
  const range = {};
  repos.forEach((repo) => {
    const state = states[repo.name];
    range[repo.name] = state.range || null;
    unmapped[repo.name] = glob
      .match(state.changed || [], repo.code)
      .filter((file) => !claimed[repo.name].has(file));
  });

  const errors = repos.map((repo) => states[repo.name].error).filter(Boolean);
  const result = { affected, errors, range, unmapped };

  if (has('--json')) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  errors.forEach((error) => console.log(`! ${error}`));
  console.log(`Docs last verified ${sync.verifiedAt || 'never'}`);
  repos.forEach((repo) =>
    console.log(`  ${repo.name}  ${range[repo.name] || '-'}`)
  );
  console.log('');

  const anyUnmapped = repos.some((repo) => unmapped[repo.name].length);
  if (!affected.length && !anyUnmapped) {
    if (!errors.length) console.log('Docs are up to date.');
    return;
  }

  affected.forEach(({ files, page, title }) => {
    console.log(`• ${title}  (${page})`);
    Object.keys(files).forEach((name) =>
      files[name].forEach((file) => console.log(`    ${name}: ${file}`))
    );
  });

  repos.forEach((repo) => {
    if (!unmapped[repo.name].length) return;
    console.log(
      `\nChanged ${repo.name} code no page claims (new area? add it to a page's sources):`
    );
    unmapped[repo.name].forEach((file) => console.log(`    ${file}`));
  });

  console.log(
    `\nUpdate these pages with /docs-sync (or follow docs-sync.md). Primary repo: ${primary.name}.`
  );
};

main();
