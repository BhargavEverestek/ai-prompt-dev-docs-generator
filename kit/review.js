#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Lists every claim marked "to confirm" in the docs, for the team that owns
 * the code behind it.
 *
 *   node <kit>/review.js        grouped by page
 *   node <kit>/review.js --md   as a Markdown checklist (paste into a ticket)
 *
 * Mark a claim in Markdown with:
 *   <span class="docs-review" title="The question to answer">to confirm</span>
 * Remove the span once it's answered (and fix the text if needed).
 */

const MARKER = /<span class="docs-review" title="([^"]*)">[^<]*<\/span>/g;

const markersOf = (body) =>
  body.split(/\r?\n/).reduce((acc, line, index) => {
    const re = new RegExp(MARKER.source, 'g');
    let match = re.exec(line);
    while (match) {
      acc.push({ line: index + 1, question: match[1] });
      match = re.exec(line);
    }
    return acc;
  }, []);

const main = () => {
  const { readDocs } = require('./lib'); // eslint-disable-line global-require
  const pages = readDocs()
    .filter((doc) => doc.title)
    .map((doc) => ({ ...doc, markers: markersOf(doc.body) }))
    .filter((doc) => doc.markers.length);

  const total = pages.reduce((n, page) => n + page.markers.length, 0);
  const asMarkdown = process.argv.includes('--md');

  pages.forEach((page) => {
    console.log(
      asMarkdown
        ? `\n### ${page.title} (\`${page.rel}\`)\n`
        : `\n${page.title}  (${page.rel})`
    );
    page.markers.forEach(({ question }) =>
      console.log(asMarkdown ? `- [ ] ${question}` : `  • ${question}`)
    );
  });
  console.log(`\n${total} items to confirm on ${pages.length} pages.`);
};

module.exports = { MARKER, markersOf };

if (require.main === module) main();
