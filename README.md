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

###特别说明
1. Vue文件被打包后会生成`.js`和`.css`文件(如果`.vue`文件中包含`style`内容的话) 。
2. 使用时在html中只需要引入.js文件即可，对应的`.css`文件会自动被引入到`.html`上下文。
3. 组件打时候，会根据Vue文件名进行生成组件对象和注册组件对象，例如： `SupperMan.vue`-->`SupperMan.js`和`SupperMan.css`,其中`SupperMan.js`中会暴露`window.SupperMan`对象且会注册一个名为`vue-supper-man`的vue组件
4. 更多请参考：[vue-multipage-project](https://github.com/radiations/vue-multipage-project)


