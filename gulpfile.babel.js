//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
//  gulp4-bootstrap v. 1.0.0                                                                    //
//                                                                                              //
//  This simple project shows you how to use Gulp4 to work with Bootstrap                       //
//  and other technologies for the web.                                                         //
//                                                                                              //
//  See README.md for more info.                                                                   //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
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
import eslint from "gulp-eslint";
import sasslint from "gulp-sass-lint";
import csslint from "gulp-csslint";
import uglify from "gulp-uglify";

// External sass compiler
sass.compiler = require('node-sass');

// Externalize gulp config
const config = require('./gulp-config.json');

// User 'dev' value for uncompressed assets, test and build
// and 'pro' for minified ones (production environment purposes)
var environment = "dev";
function setProEnv(done) {
    environment = "pro";
    log("Build environment setted to: " + environment);
    done();
}

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
    const sources = [
        config.src.theme.styles + '/theme.css',
        config.src.theme.styles + '/theme.min.css'
    ];
    return del(sources);
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
        .pipe(sasslint())
        .pipe(sasslint.format())
        .pipe(sasslint.failOnError())
        .pipe(gulp.dest(config.src.theme.styles));
}

function themeSassLint() {
    const sources = config.src.theme.sass + '/**/*.scss';
    return gulp.src(sources)
        .pipe(sasslint())
        .pipe(sasslint.format())
        .pipe(sasslint.failOnError())
}

function themeScriptsLint() {
    const sources = config.src.theme.scripts + '/**/*.js';
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
    const sources = config.src.theme.scripts + '/**/*.js';
    return gulp.src(sources)
        .pipe(eslint({
            rules: {
                quotes: [1, 'single'],
                semi: [1, 'always']
            }
        }))
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
        .pipe(gulpIf(environment === 'pro', uglify()))
        .pipe(gulpIf(environment === 'pro', rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(config.dist.scripts));
}

function distThemeStyles() {
    const sources = config.src.theme.styles + '/**/*.css';
    return gulp.src(sources)
        .pipe(csslint())
        .pipe(csslint.formatter())
        .pipe(gulpIf(environment === 'pro', cleanCSS({debug: true, compatibility: 'ie8'}, (details) => {
            log(`\t${details.name}: ${details.stats.originalSize}b (original)`);
            log(`\t${details.name}: ${details.stats.minifiedSize}b (minified)`);
        })))
        .pipe(gulpIf(environment === 'pro', rename({
            suffix: '.min'
        })))
        .pipe(gulp.dest(config.dist.styles));
}

function watch() {
    gulp.watch(config.src.vendor.scripts + '/**/*.*', distVendorScripts);
    gulp.watch(config.src.vendor.styles + '/**/*.*', distVendorStyles);
    gulp.watch(config.src.vendor.webFonts + '/**/*.*', distVendorWebfonts);
    gulp.watch(config.src.vendor.sass + '/**/*.*', vendorSass);
    gulp.watch(config.src.theme.scripts + '/**/*.*', distThemeScripts);
    gulp.watch(config.src.theme.styles + '/**/*.*', distThemeStyles);
    gulp.watch(config.src.theme.sass + '/**/*.*', themeSass);
}

/////////////////////////////////////////////////////////////
// Complex tasks
/////////////////////////////////////////////////////////////
// Clean vendor assets
const _cleanVendor = gulp.parallel(cleanVendorSass, cleanVendorScripts, cleanVendorStyles, cleanVendorWebfonts) ;
// Clean theme assets (non final ones, only builded sources)
const _cleanTheme = gulp.parallel(cleanThemeStyles);
// Clean all
const _clean = gulp.parallel(_cleanVendor, _cleanTheme, cleanDist);
// Copy all vendor assets
const _copyVendorAssets = gulp.series(copyVendorSass, copyVendorScripts, copyVendorStyles, copyVendorWebfonts);
// Build all vendor resources, if necessary
const _buildVendor = gulp.series(_copyVendorAssets, vendorSass);
// Build all theme resources
const _buildTheme = gulp.series(themeSass);
// Build all: vendor and theme resources
const _build = gulp.series(_clean, _buildVendor, _buildTheme);
// Dist vendor sources
const _distVendor = gulp.series(_buildVendor, distVendorScripts, distVendorStyles, distVendorWebfonts);
// Dist theme sources
const _distTheme = gulp.series(_buildTheme, distThemeScripts, distThemeStyles);
// Dist all
const _dist = gulp.series(setProEnv, _build, gulp.parallel(_distVendor, _distTheme));
// Watch all source files
const _watch = gulp.series(_dist, watch);

/////////////////////////////////////////////////////////////
// Public tasks
/////////////////////////////////////////////////////////////
exports.clean = _clean;
exports.build = _build;
exports.dist = _dist;
exports.watch = _watch;
exports.default = _dist;
