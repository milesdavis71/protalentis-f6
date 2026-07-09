function isExternalUrl(url) {
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(url);
}

module.exports = function routePath(root, page) {
  if (typeof page !== "string") {
    page = root;
    root = "";
  }

  const rootPath = typeof root === "string" ? root : "";
  const rawUrl = typeof page === "string" ? page : "";

  if (!rawUrl || isExternalUrl(rawUrl)) {
    return rawUrl;
  }

  const [pathPart, hashPart] = rawUrl.split("#");
  const hash = hashPart ? `#${hashPart}` : "";
  const cleanPath = pathPart.replace(/\.html$/, "");

  if (cleanPath === "index") {
    return `${rootPath || "./"}${hash}`;
  }

  return `${rootPath}${cleanPath}${hash}`;
};
