const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);
const DEFAULT_ASSET_ROOT = path.join(process.cwd(), "src", "assets", "img");

function isImage(fileName) {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function normalizeKey(fileName) {
  return path
    .basename(fileName, path.extname(fileName))
    .replace(/_(?:full|thumb)$/i, "");
}

function naturalSort(a, b) {
  return a.key.localeCompare(b.key, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function listImageFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs
    .readdirSync(directory)
    .filter(isImage)
    .map((fileName) => ({
      fileName,
      key: normalizeKey(fileName),
    }));
}

function assetPath(...parts) {
  return `/assets/img/${parts
    .map((part) => String(part).replace(/^\/+|\/+$/g, ""))
    .join("/")}`;
}

module.exports = function galleryImages(slug, options) {
  if (!options || !options.hash) {
    options = slug;
    slug = "";
  }

  const hash = options.hash || {};
  const gallerySlug = slug || hash.slug || this.slug || "gallery";
  const fullDirName = hash.fullDir || "full";
  const thumbDirName = hash.thumbDir || "thumb";
  const assetRoot = hash.root
    ? path.resolve(process.cwd(), hash.root)
    : DEFAULT_ASSET_ROOT;
  const galleryRoot = path.join(assetRoot, gallerySlug);
  const fullDir = path.join(galleryRoot, fullDirName);
  const thumbDir = path.join(galleryRoot, thumbDirName);
  const title = hash.alt || this.alt || this.title || "Galeria kep";
  const thumbsByKey = new Map(
    listImageFiles(thumbDir).map((item) => [item.key, item.fileName]),
  );
  const images = listImageFiles(fullDir)
    .filter((item) => thumbsByKey.has(item.key))
    .sort(naturalSort)
    .map((item, index) => ({
      index,
      number: index + 1,
      key: item.key,
      fullFile: item.fileName,
      thumbFile: thumbsByKey.get(item.key),
      full: assetPath(gallerySlug, fullDirName, item.fileName),
      thumb: assetPath(gallerySlug, thumbDirName, thumbsByKey.get(item.key)),
      alt: `${title} - ${index + 1}`,
    }));

  if (typeof options.fn !== "function") {
    return images;
  }

  return new Handlebars.SafeString(
    images.map((image) => options.fn(image)).join(""),
  );
};
