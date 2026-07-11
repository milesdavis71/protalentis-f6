import plugins from "gulp-load-plugins";
import yargs from "yargs";
import browser from "browser-sync";
import gulp from "gulp";
import panini from "panini";
import rimraf from "rimraf";
import sherpa from "style-sherpa";
import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import webpackStream from "webpack-stream";
import webpack2 from "webpack";
import named from "vinyl-named";
import autoprefixer from "autoprefixer";
import imagemin from "gulp-imagemin";

const sass = require("gulp-sass")(require("sass"));
const postcss = require("gulp-postcss");
const uncss = require("postcss-uncss");
const unsafeYamlTypes = require("js-yaml-js-types").all;
const YAML_SCHEMA = yaml.DEFAULT_SCHEMA.extend(unsafeYamlTypes);
const GENERATED_PALYAZAT_DIR = path.join("src", "pages", "hirek");
const GENERATED_PALYAZAT_GLOB = "src/pages/hirek/**/*.html";
const SEARCH_DATA_FILE = path.join("src", "data", "search.yml");
const SEARCH_INDEX_FILE = path.join("dist", "assets", "data", "search.json");
const HTACCESS_RULES = `Options -MultiViews
RewriteEngine On

# Redirect direct .html requests to clean URLs.
RewriteCond %{THE_REQUEST} \\s/+(.+?)\\.html[\\s?] [NC]
RewriteRule ^ %1 [R=301,L]

# Serve extensionless page URLs from their generated .html files.
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{DOCUMENT_ROOT}/$1.html -f
RewriteRule ^(.+?)/?$ $1.html [L]
`;

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!yargs.argv.production;

// Load settings from settings.yml
function loadConfig() {
  const ymlFile = fs.readFileSync("config.yml", "utf8");
  return yaml.load(ymlFile, { schema: YAML_SCHEMA });
}
const { PORT, UNCSS_OPTIONS, PATHS } = loadConfig();

console.log(UNCSS_OPTIONS);

function loadYamlFile(filePath) {
  return yaml.load(fs.readFileSync(filePath, "utf8"), { schema: YAML_SCHEMA });
}

function getPalyazatPageName(palyazatItem) {
  return palyazatItem.slug || palyazatItem.content;
}

function palyazatPageTemplate(palyazatItem) {
  const frontMatter = yaml.dump(
    {
      layout: "2_hasabos",
      title: palyazatItem.title,
      palyazatKey: palyazatItem.content,
      image: palyazatItem.image || "",
      date: palyazatItem.date || "",
      requirements: palyazatItem.requirements || palyazatItem.requirement || "",
      deadline: palyazatItem.deadline || "",
      btn_link: palyazatItem.btn_link || "",
      btn_title: palyazatItem.btn_title || "",
      classes: palyazatItem.classes || "",
      contentclass: palyazatItem.contentclass || "",
    },
    { lineWidth: -1 },
  );

  return `---\n${frontMatter}---\n{{> palyazat_article}}\n`;
}

function writeFileIfChanged(filePath, contents) {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === contents) {
    return;
  }

  fs.writeFileSync(filePath, contents);
}

function generatePalyazatPages(done) {
  const globalData = loadYamlFile(path.join("src", "data", "global.yml"));
  const palyazatItems = Array.isArray(globalData.palyazatok)
    ? globalData.palyazatok
    : [];
  const usedPageNames = new Set();
  const expectedFiles = new Set();

  fs.mkdirSync(GENERATED_PALYAZAT_DIR, { recursive: true });

  palyazatItems.forEach((palyazatItem) => {
    if (!palyazatItem.content) {
      return;
    }

    const pageName = getPalyazatPageName(palyazatItem);

    if (!pageName) {
      return;
    }

    if (usedPageNames.has(pageName)) {
      throw new Error(`Duplicate palyazat page slug: ${pageName}`);
    }

    usedPageNames.add(pageName);

    const targetPath = path.join(GENERATED_PALYAZAT_DIR, `${pageName}.html`);
    const pageContents = palyazatPageTemplate(palyazatItem);
    expectedFiles.add(path.resolve(targetPath));
    writeFileIfChanged(targetPath, pageContents);
  });

  const currentFiles = fs.readdirSync(GENERATED_PALYAZAT_DIR);

  currentFiles.forEach((fileName) => {
    const filePath = path.join(GENERATED_PALYAZAT_DIR, fileName);

    if (!fileName.endsWith(".html")) {
      return;
    }

    if (!expectedFiles.has(path.resolve(filePath))) {
      fs.unlinkSync(filePath);
    }
  });

  done();
}

function generateSearchIndex(done) {
  const entries = loadYamlFile(SEARCH_DATA_FILE);

  if (!Array.isArray(entries)) {
    throw new Error("src/data/search.yml must contain a YAML list.");
  }

  const index = entries.map((entry, indexPosition) => {
    if (!entry || !entry.title || !entry.link) {
      throw new Error(
        `Search entry ${indexPosition + 1} must have a title and a link.`,
      );
    }

    return {
      title: String(entry.title),
      link: String(entry.link),
      description: entry.description ? String(entry.description) : "",
      keywords: Array.isArray(entry.keywords)
        ? entry.keywords.map(String)
        : entry.keywords
          ? [String(entry.keywords)]
          : [],
    };
  });

  fs.mkdirSync(path.dirname(SEARCH_INDEX_FILE), { recursive: true });
  writeFileIfChanged(SEARCH_INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`);
  done();
}

// Build the "dist" folder by running all of the below tasks
// Sass must be run later so UnCSS can search for used classes in the others assets.
gulp.task(
  "build",
  gulp.series(
    clean,
    generatePalyazatPages,
    gulp.parallel(pages, javascript, images, copy, routing, generateSearchIndex),
    sassBuild,
    styleGuide,
  ),
);

// Build the site, run the server, and watch for file changes
gulp.task("default", gulp.series("build", server, watch));

// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
  rimraf(PATHS.dist, done);
}

// Copy files out of the assets folder
// This task skips over the "img", "js", and "scss" folders, which are parsed separately
function copy() {
  return gulp.src(PATHS.assets).pipe(gulp.dest(PATHS.dist + "/assets"));
}

function routing(done) {
  fs.mkdirSync(PATHS.dist, { recursive: true });
  fs.writeFileSync(path.join(PATHS.dist, ".htaccess"), HTACCESS_RULES);
  done();
}

// Copy page templates into finished HTML files
function pages() {
  return gulp
    .src("src/pages/**/*.{html,hbs,handlebars}")
    .pipe(
      panini({
        root: "src/pages/",
        layouts: "src/layouts/",
        partials: "src/partials/",
        data: "src/data/",
        helpers: "src/helpers/",
      }),
    )
    .pipe(gulp.dest(PATHS.dist));
}

// Load updated HTML templates and partials into Panini
function resetPages(done) {
  panini.refresh();
  done();
}

// Generate a style guide from the Markdown content and HTML template in styleguide/
function styleGuide(done) {
  sherpa(
    "src/styleguide/index.md",
    {
      output: PATHS.dist + "/styleguide.html",
      template: "src/styleguide/template.html",
    },
    done,
  );
}

// Compile Sass into CSS
// In production, the CSS is compressed
function sassBuild() {
  const postCssPlugins = [
    // Autoprefixer
    autoprefixer(),
    // UnCSS - Uncomment to remove unused styles in production
    // PRODUCTION && uncss(UNCSS_OPTIONS),
  ].filter(Boolean);

  return gulp
    .src("src/assets/scss/app.scss")
    .pipe($.sourcemaps.init())
    .pipe(
      sass
        .sync({
          includePaths: PATHS.sass,
          quietDeps: true,
          silenceDeprecations: [
            "legacy-js-api",
            "import",
            "global-builtin",
            "color-functions",
            "slash-div",
            "abs-percent",
          ],
        })
        .on("error", sass.logError),
    )
    .pipe(postcss(postCssPlugins))
    .pipe($.if(PRODUCTION, $.cleanCss({ compatibility: "ie11" })))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + "/assets/css"))
    .pipe(browser.reload({ stream: true }));
}

let webpackConfig = {
  mode: PRODUCTION ? "production" : "development",
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
            compact: false,
          },
        },
      },
    ],
  },
  devtool: !PRODUCTION && "source-map",
};

// Combine JavaScript into one file
// In production, the file is minified
function javascript() {
  return gulp
    .src(PATHS.entries)
    .pipe(named())
    .pipe($.sourcemaps.init())
    .pipe(webpackStream(webpackConfig, webpack2))
    .pipe(
      $.if(
        PRODUCTION,
        $.terser().on("error", (e) => {
          console.log(e);
        }),
      ),
    )
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + "/assets/js"));
}

// Copy images to the "dist" folder
// In production, the images are compressed
function images() {
  return gulp
    .src("src/assets/img/**/*")
    .pipe(
      $.if(
        PRODUCTION,
        imagemin([
          imagemin.gifsicle({ interlaced: true }),
          imagemin.mozjpeg({ quality: 85, progressive: true }),
          imagemin.optipng({ optimizationLevel: 5 }),
          imagemin.svgo({
            plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
          }),
        ]),
      ),
    )
    .pipe(gulp.dest(PATHS.dist + "/assets/img"));
}

// Start a server with BrowserSync to preview the site in
function server(done) {
  browser.init(
    {
      server: PATHS.dist,
      port: PORT,
      middleware: [cleanUrlMiddleware],
    },
    done,
  );
}

function cleanUrlMiddleware(req, res, next) {
  const [pathname, queryString] = req.url.split("?");
  const query = queryString ? `?${queryString}` : "";

  if (pathname.endsWith(".html")) {
    const cleanPath = pathname.replace(/\.html$/, "") || "/";
    res.writeHead(302, { Location: `${cleanPath}${query}` });
    res.end();
    return;
  }

  if (pathname === "/" || path.extname(pathname)) {
    next();
    return;
  }

  let decodedPath;

  try {
    decodedPath = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch (error) {
    next();
    return;
  }

  const distRoot = path.resolve(PATHS.dist);
  const htmlPath = path.resolve(distRoot, `${decodedPath}.html`);

  if (htmlPath.startsWith(distRoot) && fs.existsSync(htmlPath)) {
    req.url = `${pathname}.html${query}`;
  }

  next();
}

// Reload the browser with BrowserSync
function reload(done) {
  browser.reload();
  done();
}

// Watch for changes to static assets, pages, Sass, and JavaScript
function watch() {
  gulp.watch(PATHS.assets, copy);
  gulp
    .watch(["src/pages/**/*.html", `!${GENERATED_PALYAZAT_GLOB}`])
    .on("all", gulp.series(pages, browser.reload));
  gulp
    .watch("src/{layouts,partials}/**/*.html")
    .on("all", gulp.series(resetPages, pages, browser.reload));
  gulp
    .watch("src/data/**/*.{js,json,yml}")
    .on(
      "all",
      gulp.series(
        resetPages,
        generatePalyazatPages,
        generateSearchIndex,
        pages,
        browser.reload,
      ),
    );
  gulp
    .watch("src/helpers/**/*.js")
    .on("all", gulp.series(resetPages, pages, browser.reload));
  gulp
    .watch("src/content/**/*.md")
    .on("all", gulp.series(pages, browser.reload));
  gulp.watch("src/assets/scss/**/*.scss").on("all", sassBuild);
  gulp
    .watch("src/assets/js/**/*.js")
    .on("all", gulp.series(javascript, browser.reload));
  gulp
    .watch("src/assets/img/**/*")
    .on("all", gulp.series(resetPages, pages, images, browser.reload));
  gulp
    .watch("src/styleguide/**")
    .on("all", gulp.series(styleGuide, browser.reload));
}
