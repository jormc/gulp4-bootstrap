import gulp from "gulp";
import del from "del";
import log from "fancy-log";
import through2 from "through2";
import sass from "gulp-sass";
import autoprefixer from "gulp-autoprefixer";
import flatten from "gulp-flatten";
import cleanCSS from "gulp-clean-css";
import rename from "gulp-rename";
import gulpIf from "gulp-if";

sass.compiler = require('node-sass');

const config = require('./gulp-config.json');

// User 'dev' value for uncompressed assets,
// and 'pro' for minified ones (production environment)
const environment = "dev";

//////////////////////////////////////////////////////////////////////
// Utils tasks
//////////////////////////////////////////////////////////////////////
// Add a new array functionallity that offer us only resources maked as "active=true"
Array.prototype.actives = function () {
    return this.filter(function (value, index, self) {
        return self.indexOf(value) === index && value.active === true;
    });
};

// Simple callback stream used to synchronize stuff
// Source: http://unobfuscated.blogspot.co.at/2014/01/executing-asynchronous-gulp-tasks-in.html
// https://andreasrohner.at/posts/Web%20Development/Gulp/How-to-synchronize-a-Gulp-task-that-starts-multiple-streams-in-a-loop/
function synchro(done) {
    return through2.obj(
        function (data, enc, cb) {
            cb();
        },
        function (cb) {
            cb();
            done();
        }
    );
}

/////////////////////////////////////////////////////////////
// Gulp tasks
/////////////////////////////////////////////////////////////
function cleanVendorSass(done) {
    return del(config.src.vendor.sass);
}

function copyVendorSass(done) {

    const sources = config.assets.vendor.sass.actives();

    var doneCounter = 0;
    function incDoneCounter() {
        doneCounter += 1;
        if (doneCounter >= sources.length) {
            done();
        }
    }

    sources.forEach(source =>  {
        gulp.src(source.src)
            .pipe(gulp.dest(config.src.vendor.sass + '/' + source.name))
            .pipe(synchro(incDoneCounter));
    });

}

function cleanVendorScripts(done) {
    return del(config.src.vendor.scripts);
}

function copyVendorScripts(done) {

    const sources = config.assets.vendor.scripts.actives();

    var doneCounter = 0;
    function incDoneCounter() {
        doneCounter += 1;
        if (doneCounter >= sources.length) {
            done();
        }
    }

    sources.forEach(source =>  {

        var scripts = [];
        if (environment === 'pro') {
            scripts = source.src.min;
        } else {
            scripts = source.src.expanded;
        }

        scripts.forEach(script =>  {
            gulp.src(script)
                .pipe(gulp.dest(config.src.vendor.scripts))
                .pipe(synchro(incDoneCounter));
        });
    });

}

function cleanVendorStyles(done) {
    return del(config.src.vendor.styles);
}

function copyVendorStyles(done) {

    const sources = config.assets.vendor.styles.actives();

    var doneCounter = 0;
    function incDoneCounter() {
        doneCounter += 1;
        if (doneCounter >= sources.length) {
            done();
        }
    }

    sources.forEach(source =>  {
        
        var styles = [];
        if (environment === 'pro') {
            styles = source.src.min;
        } else {
            styles = source.src.expanded;
        }

        styles.forEach(style =>  {
            gulp.src(style)
                .pipe(gulp.dest(config.src.vendor.styles))
                .pipe(synchro(incDoneCounter));
        });
    });

}

function cleanVendorWebfonts(done) {
    return del(config.src.vendor.webfonts);
}

function copyVendorWebfonts(done) {
    const sources = config.assets.vendor.webfonts.actives();

    var doneCounter = 0;
    function incDoneCounter() {
        doneCounter += 1;
        if (doneCounter >= sources.length) {
            done();
        }
    }

    sources.forEach(source =>  {
        gulp.src(source.src)
            .pipe(gulp.dest(config.src.vendor.webfonts))
            .pipe(synchro(incDoneCounter));
    });
}

function vendorSass(done) {
    const sources = config.src.vendor.sass + '/**/*.scss';

    return gulp.src(sources)
        .pipe(
            sass
            .sync({
                outputStyle: "expanded"
            })
            .on("error", sass.logError)
        )
        .pipe(autoprefixer())
        .pipe(flatten({ includeParents: 0} ))
        .pipe(gulpIf(environment === 'pro', cleanCSS({debug: true, compatibility: 'ie8'}, (details) => {
            log(`\t${details.name}: ${details.stats.originalSize}b (original)`);
            log(`\t${details.name}: ${details.stats.minifiedSize}b (minified)`);
        })))
        .pipe(gulpIf(environment === 'pro', rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(config.src.vendor.styles));
}

function cleanThemeStyles(done) {
    return del(config.src.theme.styles + '/theme.css');
}

function themeSass() {
    const sources = config.src.theme.sass + '/**/*.scss';

    return gulp.src(sources)
        .pipe(
            sass
            .sync({
                outputStyle: "expanded"
            })
            .on("error", sass.logError)
        )
        .pipe(autoprefixer())
        .pipe(flatten({ includeParents: 0} ))
        .pipe(gulpIf(environment === 'pro', cleanCSS({debug: true, compatibility: 'ie8'}, (details) => {
            log(`\t${details.name}: ${details.stats.originalSize}b (original)`);
            log(`\t${details.name}: ${details.stats.minifiedSize}b (minified)`);
        })))
        .pipe(gulpIf(environment === 'pro', rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(config.src.theme.styles));
}

function cleanDist() {
    const sources = [
        config.dist.scripts,
        config.dist.styles,
        config.dist.webfonts
    ];

    return del(sources);
}

function distVendorScripts() {
    const sources = config.src.vendor.scripts + '/**/*.*';
    return gulp.src(sources).pipe(gulp.dest(config.dist.scripts));
}

function distVendorStyles() {
    const sources = config.src.vendor.styles + '/**/*.*';
    return gulp.src(sources).pipe(gulp.dest(config.dist.styles));
}

function distVendorWebfonts() {
    const sources = config.src.vendor.webfonts + '/**/*.*';
    return gulp.src(sources).pipe(gulp.dest(config.dist.webfonts));
}

function distThemeScripts() {
    const sources = config.src.theme.scripts + '/**/*.*';
    return gulp.src(sources).pipe(gulp.dest(config.dist.scripts));
}

function distThemeStyles() {
    const sources = config.src.theme.styles + '/**/*.*';
    return gulp.src(sources).pipe(gulp.dest(config.dist.styles));
}

function watch() {
    gulp.watch(config.src.vendor.scripts + '/**/*.*', distVendorScripts);
    gulp.watch(config.src.vendor.styles + '/**/*.*', distVendorStyles);
    gulp.watch(config.src.vendor.webFonts + '/**/*.*', distVendorWebfonts);
    gulp.watch(config.src.vendor.sass + '/**/*.*', vendorSass);
}

/////////////////////////////////////////////////////////////
// Complex tasks
/////////////////////////////////////////////////////////////
const _copyVendorSass = gulp.series(cleanVendorSass, copyVendorSass);
const _copyVendorScripts = gulp.series(cleanVendorScripts, copyVendorScripts);
const _copyVendorStyles = gulp.series(cleanVendorStyles, copyVendorStyles);
const _copyVendorWebfonts = gulp.series(cleanVendorWebfonts, copyVendorWebfonts);
const _copyVendorAssets = gulp.parallel(_copyVendorSass, _copyVendorScripts, _copyVendorStyles, _copyVendorWebfonts);
const _cleanVendorAssets = gulp.parallel(cleanVendorSass, cleanVendorScripts, cleanVendorStyles, cleanVendorWebfonts);
const _vendorSass = vendorSass;
const _themeSass = gulp.series(cleanThemeStyles, themeSass);

const _clean = gulp.parallel(_cleanVendorAssets, cleanThemeStyles, cleanDist);
const _build = gulp.series(_clean, _copyVendorAssets, _vendorSass, _themeSass);
const _distVendor = gulp.parallel(distVendorScripts, distVendorStyles, distVendorWebfonts);
const _distTheme = gulp.parallel(distThemeScripts, distThemeStyles);
const _dist = gulp.series(_build, _distVendor, _distTheme);
const _watch = gulp.series(_dist, watch);

/////////////////////////////////////////////////////////////
// Public tasks
/////////////////////////////////////////////////////////////
exports.default = _dist;
exports.clean = _clean;
exports.cleanAssets = _cleanVendorAssets;
exports.watch = _watch;