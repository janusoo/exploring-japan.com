/* gulpfile.js */

/**
* Import uswds-compile
*/
const uswds = require("@uswds/compile");
const gulp = require("gulp");

const pkg = require("./node_modules/@uswds/uswds/package.json");
const sass = require("gulp-sass")(require('sass'));
const sourcemaps = require("gulp-sourcemaps");
const buildSass = uswds.compileSass;
const buildIcons = uswds.compileIcons;
// const uswdsPaths = uswds.paths;

let terser, lec;
try { terser = require("gulp-terser"); }
catch { terser = null; }
try { lec = require("gulp-line-ending-corrector"); }
catch { lec = null; }

/**
* USWDS version
* Set the major version of USWDS you're using
* (Current options are the numbers 2 or 3)
*/
uswds.settings.version = 3;

/**
* Path settings
* Set as many as you need
*/
let pathsettings = {
  compile: {
    paths: {
      src: {
        projectSass: './src/scss',
        projectIncludes: './src/includes',
        projectJs: './src/js',
        projectHtml: './src/html',
        projectIcons: './src/images/custom-icons',
      },
      dist: {
        includes: './dist/includes',
        html: './dist',
        images: './dist/images',
        fonts: './dist/fonts',
        css: './dist/css',
        js: './dist/scripts',
      },
      dist_dev: {
        css: './dist-dev/css',
        js: './dist-dev/scripts',
      },
      dist_prod: {
        css: './dist-prod/css',
        js: './dist-prod/scripts',
      }
    }
  }
};

let themepaths = pathsettings.compile.paths;

// Sass entry point and settings
// uswds.paths.dist.css = './assets/css';
// uswds.paths.dist.theme = './sass/uswds';
uswds.paths.dist.theme = themepaths.src.projectSass;

// The watch script will watch projectSass directory for changes
uswds.paths.src.projectSass = themepaths.src.projectSass;
uswds.paths.src.projectIcons = themepaths.src.projectIcons;

// Project destination for assets
uswds.paths.dist.img = themepaths.dist.images;
uswds.paths.dist.fonts = themepaths.dist.fonts;
uswds.paths.dist.css = themepaths.dist.css;
uswds.paths.dist.js = themepaths.dist.js;

// Source Arrays
const sources_includes = [
  `${themepaths.src.projectIncludes}/*.*`,
];
const sources_html = [
  `${themepaths.src.projectHtml}/**/*.html`,
  `!${themepaths.src.projectHtml}/_content/*`,
];
const sources_scss = [
  `${themepaths.src.projectSass}/*.scss`,
];
const sources_js = [
  `${themepaths.src.projectJs}/*.js`,
  `!${themepaths.src.projectJs}/*.min.js`,
];
const prod_sources_scss = [
  `${themepaths.src.projectSass}/*.scss`,
  `!${themepaths.src.projectSass}/z-*.scss`,
];
const prod_sources_js = [
  `${themepaths.src.projectJs}/*.js`,
  `!${themepaths.src.projectJs}/*.min.js`,
  `!${themepaths.src.projectJs}/z-*.js`,
];

/**
* Tasks
*/
function buildDevJs(sources, dest) {
  if(terser) {
    // return gulp.src(sources, { sourcemaps: true })
    return gulp.src(sources)
      .pipe(sourcemaps.init({
        largeFile: true,
        loadMaps: true
      }))
      .pipe(terser())
      .pipe(sourcemaps.write("."))
      // .pipe(lec({ verbose: true, eolc: 'CRLF'}))
      .pipe(lec({ eolc: 'CRLF'}))
      .pipe(gulp.dest(dest));
      // .pipe(gulp.dest(dest), { sourcemaps: true });
  }
  else {
    return gulp.src(sources)
      .pipe(gulp.dest(dest));
  }
}

function buildJs() {
  return buildDevJs(sources_js, `${uswds.paths.dist.js}`);
}

async function buildIncludes(cb) {
  return gulp.src(sources_includes).pipe(gulp.dest(`${themepaths.dist.includes}`));
  cb();
}

function buildHtml() {
  return gulp.src(sources_html).pipe(gulp.dest(`${themepaths.dist.html}`));
}

const autoprefixer = require("autoprefixer");
const csso = require("postcss-csso");
const replace = require("gulp-replace");
const postcss = require("gulp-postcss");
const browserslist = ["> 2%", "last 2 versions", "IE 11", "not dead"];
const uswds_packages = './node_modules/@uswds/uswds/packages';

const buildSettings = {
  plugins: [
    autoprefixer({
      cascade: false,
      grid: true,
      overrideBrowserslist: browserslist,
    }),
    csso({ forceMediaMerge: false }),
  ],
  includes: [
    uswds.paths.dist.theme,
    uswds_packages
  ],
};

function buildProdSass() {
  return (gulp
    .src(prod_sources_scss)
    .pipe(
      // sass.sync({
      sass({
        outputStyle: "compressed",
        includePaths: buildSettings.includes,
      })
    )
    .pipe(replace(/\buswds @version\b/g, "based on uswds v" + pkg.version))
    .pipe(postcss(buildSettings.plugins))
    .pipe(gulp.dest(`${themepaths.dist_prod.css}`))
  );
}

function buildProdJs() {
  if (terser) {
    return gulp.src(prod_sources_js)
      .pipe(terser())
      .pipe(gulp.dest(`${themepaths.dist_prod.js}`));
  }
  else {
    return gulp.src(prod_sources_js)
      .pipe(gulp.dest(`${themepaths.dist_prod.js}`));
  }
}

function watchProto() {
  gulp.watch([`${themepaths.src.projectSass}/**/*.scss`], buildSass);
  gulp.watch([`${themepaths.src.projectIcons}/**/*.svg`], buildIcons);
  gulp.watch([`${themepaths.src.projectJs}/**/*.js`], buildJs);
  gulp.watch([`${themepaths.src.projectIncludes}/**/*.*`], buildIncludes);
  gulp.watch([`${themepaths.src.projectHtml}/**/*.html`], buildHtml);
}

/**
* Exports
* Add as many as you need
*/
exports.init = uswds.init;
// exports.compile = uswds.compile;
// exports.watch = uswds.watch;
// exports.watch = watch;
// exports.watch = gulp.series(buildProto, watchProto);
exports.watch = gulp.series(buildSass, buildJs, buildIncludes, buildHtml, watchProto);
exports.compileSass = buildSass;

exports.buildProto = gulp.series(buildSass, buildJs, buildIncludes, buildHtml);
exports.buildProd = gulp.series(buildProdSass, buildProdJs);

exports.pathsettings = pathsettings;
