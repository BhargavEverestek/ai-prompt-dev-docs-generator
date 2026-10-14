#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Installs the docs check as git post-merge and post-rewrite hooks. Git
 * doesn't version hooks, so each developer who maintains the docs runs this
 * once. Existing hooks are kept; the check is appended to them. The check
 * itself only runs on the docs branch (docsBranch in docs-kit.config.json).
 */

const fs = require('fs');
const path = require('path');
const { git, KIT_DIR, REPO_ROOT, toPosix } = require('./lib');

const hooksDir = path.resolve(
  REPO_ROOT,
  git(REPO_ROOT, 'rev-parse --git-path hooks')
);
const checkScript = toPosix(
  path.relative(REPO_ROOT, path.join(KIT_DIR, 'check.js'))
);
const marker = '# docs-kit';

fs.mkdirSync(hooksDir, { recursive: true });

['post-merge', 'post-rewrite'].forEach((name) => {
  const command = `node "${checkScript}" --from-hook ${name} "$@" || true`;
  const file = path.join(hooksDir, name);
  if (fs.existsSync(file)) {
    const current = fs.readFileSync(file, 'utf8');
    if (current.includes(marker)) {
      console.log(`${name}: already installed`);
      return;
    }
    fs.appendFileSync(file, `\n${marker}\n${command}\n`);
    console.log(`${name}: appended to existing hook`);
    return;
  }
  fs.writeFileSync(file, `#!/bin/sh\n${marker}\n${command}\n`, { mode: 0o755 });
  console.log(`${name}: installed`);
});
