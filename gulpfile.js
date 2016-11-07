const gulp = require('gulp');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const replace = require('gulp-replace');

gulp.task('default', ['build', 'build-babel', 'minify', 'minify-babel'], () => {
});

gulp.task('build', () => {
    return gulp.src(['./source/**/*.js'])
        .pipe(concat('everGis.js'))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('build-babel', () => {
    return gulp.src(['./source/**/*.js'])
        .pipe(babel({
            presets: ['es2015'],
            plugins: ['remove-comments']
        }))
        .pipe(concat('everGis.babel.js'))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('minify', () => {
    return gulp.src(['./source/**/*.js'])
        .pipe(babel({
            presets: ['babili'],
            plugins: ['remove-comments']
        }))
        .pipe(concat('everGis.min.js'))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('minify-babel', () => {
    return gulp.src(['./source/**/*.js'])
        .pipe(babel({
            presets: ['es2015', 'babili'],
            plugins: ['remove-comments']
        }))
        .pipe(concat('everGis.babel.min.js'))
        .pipe(gulp.dest('./dist/'))
});

gulp.task('version', () => {
    var version = process.env.npm_package_version;
    console.log(version);

    gulp.src(['./source/SpatialProcessor.js'])
        .pipe(replace(/SpatialProcessor\.version\s*=\s*".+"/, 'SpatialProcessor.version = "' + version + '"'))
        .pipe(replace(/SpatialProcessor\.releaseDate\s*=\s*".+"/, 'SpatialProcessor.releaseDate = "' + today() + '"'))
        .pipe(gulp.dest('./source/'));
});

function today() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth()+1;
    var yyyy = today.getFullYear();

    if(dd<10) {
        dd='0'+dd
    }

    if(mm<10) {
        mm='0'+mm
    }

    today = dd + '.' + mm + '.' + yyyy;
    return today;
}