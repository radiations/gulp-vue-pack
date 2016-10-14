# gulp-vue-pack
多页模式的Vue组件打包工具。将单个`.Vue`的组件转成`.js`，不考虑`import`和`require`等声明的依赖，在`html`文件中使用`script`标签手动引用，以提升`html`中资源的加载效率(不使用require)

##使用方式
###安装
>通过npm安装

```
npm install gulp-vue-pack --save-dev
```

###使用
>示例代码

```
var vuePack = require("gulp-vue-pack");

gulp.task("default", function(){
	gulp.src("src/**/*.vue")
		.pipe(vuePack())
		.pipe(gulp.dest("build/"));
});
```



