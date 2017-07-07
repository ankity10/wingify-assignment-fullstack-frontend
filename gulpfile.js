var gulp = require('gulp');
var bs = require('browser-sync').create(); // create a browser sync instance.
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var htmlReplace = require('gulp-html-replace');


var path = {
    build: {

        css: 'build/css',
        js: 'build/js',
        fonts: 'build/css/fonts',
        icons: 'build/css/icons',
        html: 'build/'
    },
    src: {
        css: ['src/css/icons.css', 'src/css/main.css', 'src/lib/*/dist/*.css'],
        js: ['src/lib/jquery/dist/jquery.min.js', 'src/lib/jquery-toast-plugin/dist/*.min.js', 'src/js/*.js'],
        icons: 'src/css/icons/*.*',
        fonts: 'src/css/fonts/*.*',
        html: 'src/*.html'
    }
};


gulp.task('serve-dev', function () {
    bs.init({
        server: {
            baseDir: "./src/"
        }
    });
    gulp.watch(["./src/*.html", "./src/js/*.js", "./src/css/*.css"], bs.reload);
});

gulp.task('js', function () {
    gulp.src(path.src.js)
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(gulp.dest(path.build.js));
});

gulp.task('css', function () {
    gulp.src(path.src.css).pipe(autoprefixer({
        browsers: ['last 2 versions'],
        cascade: false
    }))
        .pipe(concat('all.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest(path.build.css));
});

gulp.task('copy-fonts', function () {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts));
});

gulp.task('copy-icons', function () {
    gulp.src(path.src.icons)
        .pipe(gulp.dest(path.build.icons));
});

gulp.task('replace-html', function () {
    gulp.src(path.src.html)
        .pipe(htmlReplace({
            css: 'css/all.css',
            js: 'js/all.js'
        }))
        .pipe(gulp.dest(path.build.html));
});

gulp.task('copy', ['copy-fonts', 'copy-icons']);

gulp.task('build', ['css', 'js', 'copy', 'replace-html']);

gulp.task('default', ['serve-dev']);

gulp.task('server-production', function () {
    bs.init({
        server: {
            baseDir: "./build/"
        }
    });
});

gulp.task('serve-prod', ['build', 'server-production']);