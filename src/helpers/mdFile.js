const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const marked = require("marked");

const CONTENT_ROOT = path.join(process.cwd(), "src", "content");

marked.setOptions({
  headerIds: false,
  mangle: false,
});

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

module.exports = function mdFile(key, options) {
  if (!options || !options.hash) {
    options = key;
    key = "";
  }

  const hash = options.hash || {};
  const slugValue = hash.slug === false ? String(key || "") : slugify(key);
  const relativePath =
    hash.path || path.join(hash.dir || "", `${slugValue}${hash.ext || ".md"}`);
  const absolutePath = path.join(CONTENT_ROOT, relativePath);

  if (!fs.existsSync(absolutePath)) {
    if (hash.optional) {
      return "";
    }

    throw new Error(`Markdown content file not found: ${relativePath}`);
  }

  const markdownSource = fs.readFileSync(absolutePath, "utf8");
  const context = Object.assign({}, options.data && options.data.root, this);
  const renderedMarkdown = Handlebars.compile(markdownSource)(context);

  return new Handlebars.SafeString(marked.parse(renderedMarkdown));
};
