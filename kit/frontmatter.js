// Reads the YAML frontmatter of a docs page without a YAML package. It
// supports the subset docs pages use:
//   key: value              strings (plain or quoted), numbers, true/false/null
//   key: value # comment
//   key: [a, 'b']           inline lists
//   key:                    block lists
//     - 'a'
//   key:                    text wrapped over several lines (or after | / >)
//     long text continues
// Anything more complex is read as plain text.

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

// removes a trailing " # comment" that isn't inside quotes
const stripComment = (value) => {
  let quote = null;
  for (let i = 0; i < value.length; i += 1) {
    const c = value[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === '#' && (i === 0 || /\s/.test(value[i - 1]))) {
      return value.slice(0, i).trimEnd();
    }
  }
  return value.trim();
};

const scalar = (raw) => {
  const value = stripComment(raw).trim();
  if (value.length >= 2 && value[0] === "'" && value.endsWith("'")) {
    return value.slice(1, -1).replace(/''/g, "'");
  }
  if (value.length >= 2 && value[0] === '"' && value.endsWith('"')) {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value.slice(1, -1);
    }
  }
  if (value === '' || value === '~' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
};

// "[a, 'b, c', d]" -> ['a', 'b, c', 'd']
const inlineList = (raw) => {
  const inner = stripComment(raw).trim().slice(1, -1);
  const items = [];
  let quote = null;
  let start = 0;
  for (let i = 0; i < inner.length; i += 1) {
    const c = inner[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") {
      quote = c;
    } else if (c === ',') {
      items.push(inner.slice(start, i));
      start = i + 1;
    }
  }
  items.push(inner.slice(start));
  return items.filter((item) => item.trim()).map(scalar);
};

const parseYaml = (text) => {
  const data = {};
  let key = null;
  let mode = null; // 'pending' | 'list' | 'text'

  text.split(/\r?\n/).forEach((line) => {
    if (!line.trim() || /^\s*#/.test(line)) return;

    const top = line.match(/^([A-Za-z_][\w-]*)\s*:(?:\s+(.*))?$/);
    if (top) {
      key = top[1];
      const rest = stripComment(top[2] || '');
      if (!rest || /^[|>][+-]?$/.test(rest)) {
        data[key] = null;
        mode = 'pending';
      } else if (rest[0] === '[') {
        data[key] = inlineList(rest);
        mode = null;
      } else {
        data[key] = scalar(rest);
        mode = /^["']/.test(rest) ? null : 'text';
      }
      return;
    }
    if (!key) return;

    const item = line.match(/^\s*-\s+(.*)$/);
    if (item && (mode === 'pending' || mode === 'list')) {
      data[key] = (mode === 'list' ? data[key] : []).concat(scalar(item[1]));
      mode = 'list';
      return;
    }
    if (/^\s/.test(line) && (mode === 'pending' || mode === 'text')) {
      const part = line.trim();
      data[key] =
        mode === 'text' && data[key] != null ? `${data[key]} ${part}` : part;
      mode = 'text';
    }
  });

  return data;
};

const parseFrontmatter = (source) => {
  const found = source.match(FRONTMATTER);
  if (!found) return { body: source, data: {} };
  return { body: source.slice(found[0].length), data: parseYaml(found[1]) };
};

module.exports = { parseFrontmatter, parseYaml };
