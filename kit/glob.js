// Minimal glob matching for `sources:` and the kit config, so the kit needs no
// packages. Paths use forward slashes (as git prints them). Supported:
//   *        any characters except /
//   **       any number of folders (as a whole path segment)
//   ?        one character except /
//   {a,b}    alternatives (may contain other glob syntax)
//   [abc]    character class ([!abc] negates)
//   !glob    exclude (in a list of patterns)
// Dotfiles match like any other file.

const escapeChar = (c) => c.replace(/[.+^${}()|[\]\\]/g, '\\$&');

// index of the brace closing the one at `open`, or -1
const closingBrace = (glob, open) => {
  let depth = 0;
  for (let i = open; i < glob.length; i += 1) {
    if (glob[i] === '\\') i += 1;
    else if (glob[i] === '{') depth += 1;
    else if (glob[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
};

// splits "a,{b,c},d" on top-level commas
const splitAlternatives = (inner) => {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < inner.length; i += 1) {
    if (inner[i] === '\\') i += 1;
    else if (inner[i] === '{') depth += 1;
    else if (inner[i] === '}') depth -= 1;
    else if (inner[i] === ',' && depth === 0) {
      parts.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(inner.slice(start));
  return parts;
};

const toSource = (glob) => {
  let out = '';
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === '*') {
      const segmentStart = i === 0 || glob[i - 1] === '/';
      const segmentEnd = i + 2 === glob.length || glob[i + 2] === '/';
      if (glob[i + 1] === '*' && segmentStart && segmentEnd) {
        if (glob[i + 2] === '/') {
          out += '(?:.*/)?';
          i += 3;
        } else {
          out += '.*';
          i += 2;
        }
      } else {
        out += '[^/]*';
        while (glob[i] === '*') i += 1;
      }
    } else if (c === '?') {
      out += '[^/]';
      i += 1;
    } else if (c === '{' && closingBrace(glob, i) > i) {
      const close = closingBrace(glob, i);
      const alternatives = splitAlternatives(glob.slice(i + 1, close));
      out +=
        alternatives.length > 1
          ? `(?:${alternatives.map(toSource).join('|')})`
          : escapeChar(glob.slice(i, close + 1));
      i = close + 1;
    } else if (c === '[' && glob.indexOf(']', i + 2) > i) {
      const close = glob.indexOf(']', i + 2);
      const set = glob.slice(i + 1, close).replace(/\\/g, '\\\\');
      out += `[${set[0] === '!' ? `^${set.slice(1)}` : set}]`;
      i = close + 1;
    } else if (c === '\\' && i + 1 < glob.length) {
      out += escapeChar(glob[i + 1]);
      i += 2;
    } else {
      out += escapeChar(c);
      i += 1;
    }
  }
  return out;
};

const cache = {};
const toRegExp = (glob) => {
  if (!cache[glob]) cache[glob] = new RegExp(`^${toSource(glob)}$`);
  return cache[glob];
};

// true when `file` matches at least one pattern and no "!" pattern
const isMatch = (file, patterns) => {
  const list = [].concat(patterns);
  const include = list.filter((p) => p[0] !== '!');
  const exclude = list.filter((p) => p[0] === '!').map((p) => p.slice(1));
  return (
    include.some((p) => toRegExp(p).test(file)) &&
    !exclude.some((p) => toRegExp(p).test(file))
  );
};

// files matching the patterns / files matching none of them
const match = (files, patterns) => files.filter((f) => isMatch(f, patterns));
const notMatch = (files, patterns) =>
  files.filter((f) => !isMatch(f, patterns));

module.exports = { isMatch, match, notMatch, toRegExp };
