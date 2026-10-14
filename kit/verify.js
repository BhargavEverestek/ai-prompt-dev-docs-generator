#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Checks the docs without building anything:
 *   - every page has a title (otherwise the in-app UI doesn't publish it)
 *   - relative links point at existing files; #anchors match a heading
 *   - every ```mermaid block parses (when mermaid and jsdom are installed)
 *   - every `sources` glob still matches at least one file (catches renames)
 *   - every "to confirm" marker carries a question
 *
 *   node <kit>/verify.js        exits 1 on errors
 *
 * Optional packages: github-slugger (exact GitHub anchors), mermaid + jsdom.
 */

const fs = require('fs');
const path = require('path');
const glob = require('./glob');
const {
  DOCS_DIR,
  isRepo,
  lines,
  readDocs,
  REPO_ROOT,
  repos,
  resolveRef,
  tryGit,
} = require('./lib');
const { MARKER } = require('./review');

const errors = [];
const warnings = [];
const fail = (page, message) => errors.push(`${page}: ${message}`);

const optional = (name) => {
  try {
    return require(name); // eslint-disable-line global-require, import/no-dynamic-require
  } catch (e) {
    return null;
  }
};

// github-slugger when installed; otherwise the same rules for common text
const createSlugger = () => {
  const GithubSlugger = optional('github-slugger');
  if (GithubSlugger) return new GithubSlugger();
  const seen = {};
  return {
    slug: (text) => {
      const base = text
        .toLowerCase()
        .trim()
        .replace(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
        .replace(/ /g, '-');
      const count = seen[base] || 0;
      seen[base] = count + 1;
      return count ? `${base}-${count}` : base;
    },
  };
};

const stripCodeBlocks = (body) => body.replace(/^```[\s\S]*?^```/gm, '');

// heading text the way Markdown renderers slug it
const headingText = (raw) =>
  raw
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_]/g, '')
    .trim();

const anchorsOf = (body) => {
  const slugger = createSlugger();
  return new Set(
    stripCodeBlocks(body)
      .split(/\r?\n/)
      .filter((line) => /^#{1,6}\s/.test(line))
      .map((line) => slugger.slug(headingText(line.replace(/^#+\s*/, ''))))
  );
};

// mermaid's browser bundle inside jsdom; null when either isn't installed
const loadMermaid = () => {
  const jsdom = optional('jsdom');
  let bundle = null;
  try {
    bundle = require.resolve('mermaid/dist/mermaid.min.js');
  } catch (e) {
    bundle = null;
  }
  if (!jsdom || !bundle) return null;
  const dom = new jsdom.JSDOM('<body></body>', {
    pretendToBeVisual: true,
    runScripts: 'outside-only',
  });
  dom.window.eval(fs.readFileSync(bundle, 'utf8'));
  return dom.window.mermaid || null;
};

const filesOf = (repo) => {
  if (repo.primary) {
    return lines(tryGit(repo.cwd, 'ls-files')).concat(
      lines(tryGit(repo.cwd, 'ls-files --others --exclude-standard'))
    );
  }
  if (!isRepo(repo)) return null;
  return lines(
    tryGit(
      repo.cwd,
      `ls-tree -r --name-only ${resolveRef(repo.cwd, repo.branch)}`
    )
  );
};

const checkLinks = (doc, anchors) => {
  const text = stripCodeBlocks(doc.body);
  const linkRe = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match = linkRe.exec(text);
  while (match) {
    const url = match[1];
    if (!/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) {
      const [target, hash] = url.split('#');
      const resolved = target
        ? path.resolve(path.dirname(doc.file), decodeURI(target))
        : doc.file;
      if (target && !fs.existsSync(resolved)) {
        fail(doc.rel, `broken link ${url}`);
      } else if (hash && /\.md$/i.test(resolved)) {
        const targetAnchors = anchors[resolved] || new Set();
        if (!targetAnchors.has(hash)) fail(doc.rel, `missing anchor ${url}`);
      }
    }
    match = linkRe.exec(text);
  }
};

const checkDiagrams = async (doc, getMermaid) => {
  const diagramRe = /^```mermaid\r?\n([\s\S]*?)^```/gm;
  let diagram = diagramRe.exec(doc.body);
  while (diagram) {
    const mermaid = getMermaid();
    if (!mermaid) return;
    try {
      // mermaid 8/9 parse synchronously; 10+ return a promise
      await Promise.resolve(mermaid.parse(diagram[1])); // eslint-disable-line no-await-in-loop
    } catch (e) {
      fail(
        doc.rel,
        `mermaid: ${String(e.str || e.message || e).split('\n')[0]}`
      );
    }
    diagram = diagramRe.exec(doc.body);
  }
};

const checkMarkers = (doc) => {
  const markerCount = (doc.body.match(/class="docs-review"/g) || []).length;
  const validMarkers = (doc.body.match(MARKER) || []).filter(
    (marker) => !/title="\s*"/.test(marker)
  ).length;
  if (markerCount !== validMarkers) {
    fail(
      doc.rel,
      '"to confirm" marker without a question (title) or in the wrong form'
    );
  }
};

const checkSources = (doc, repoFiles) => {
  const total = Object.keys(doc.sources).reduce(
    (n, name) => n + doc.sources[name].length,
    0
  );
  if (path.dirname(doc.file) !== DOCS_DIR && !total) {
    warnings.push(`${doc.rel}: no sources, so code changes never flag it`);
  }
  Object.keys(doc.sources).forEach((name) => {
    const files = repoFiles[name];
    if (!files) return;
    doc.sources[name].forEach((pattern) => {
      if (!glob.match(files, pattern).length) {
        fail(doc.rel, `source matches nothing in ${name}: ${pattern}`);
      }
    });
  });
};

const main = async () => {
  const docs = readDocs();
  const anchors = {};
  docs.forEach((doc) => {
    anchors[doc.file] = anchorsOf(doc.body);
  });

  const repoFiles = {};
  repos.forEach((repo) => {
    repoFiles[repo.name] = filesOf(repo);
    if (!repoFiles[repo.name]) {
      warnings.push(
        `${repo.name} not found at ${repo.cwd}; its sources not checked`
      );
    }
  });

  let mermaid;
  let mermaidMissing = false;
  const getMermaid = () => {
    if (mermaid === undefined) {
      mermaid = loadMermaid();
      mermaidMissing = !mermaid;
    }
    return mermaid;
  };

  // eslint-disable-next-line no-restricted-syntax
  for (const doc of docs) {
    if (!doc.title) {
      warnings.push(
        `${doc.rel}: no title in frontmatter, so it is not published`
      );
      continue; // eslint-disable-line no-continue
    }
    checkLinks(doc, anchors);
    await checkDiagrams(doc, getMermaid); // eslint-disable-line no-await-in-loop
    checkMarkers(doc);
    checkSources(doc, repoFiles);
  }

  if (mermaidMissing) {
    warnings.push('mermaid or jsdom not installed; diagrams not checked');
  }
  if (!fs.existsSync(REPO_ROOT)) {
    errors.push(`repo root not found: ${REPO_ROOT}`);
  }

  warnings.forEach((warning) => console.log(`warn  ${warning}`));
  errors.forEach((error) => console.log(`error ${error}`));
  console.log(
    `\n${docs.filter((d) => d.title).length} pages checked: ${
      errors.length
    } errors, ${warnings.length} warnings`
  );
  if (errors.length) process.exit(1);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
