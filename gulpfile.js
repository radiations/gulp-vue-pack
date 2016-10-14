/**
 * 作者: bullub
 * 日期: 16/10/14 16:07
 * 用途:
 */
const gulp = require("gulp");
const vuePack = require("./src");

gulp.task("example", function() {
    gulp.src("example/**/*.vue")
        .pipe(vuePack())
        .pipe(gulp.dest("build/"))
});