/**
 * 作者: bullub
 * 日期: 16/10/14 15:18
 * 用途:
 */
"use strict";

const gutil = require("gulp-util");
const through2 = require("through2");
const path = require("path");
const File = require("vinyl");
const HTMLParser = require("htmlparser2");

const PluginError = gutil.PluginError;

const SCRIPT = "script";
const STYLE = "style";
const TEMPLATE = "template";

const TEMPLATE_ESCAPE_REG = /'/mg
const TEMPLATE_ESCAPE_REG2 = /\r?\n/mg;
const SCRIPT_REPLACER_REG = /^\s*export\s+default\s*/im;
const VUE_COMPONENT_IMPORT_REG = /^\s*import\s+([^\s]+)\s+from\s+([^;\n]+)[\s;]+?$/mg;

module.exports = function () {
    return through2.obj(vuePack);
};

/**
 * 打包组件成js和css文件
 * @param file
 * @param encoding
 * @param callback
 */
function vuePack(file, encoding, callback) {
    if (!file) {
        throw new PluginError('gulp-vue-pack', 'file不存在');
    }

    if (file.isStream()) {
        throw new PluginError('gulp-vue-pack', '只支持.vue文件');
    }

    if (!file.contents) {
        //非文件,是目录
        callback();
        return;
    }

    let fileName = path.basename(file.path, ".vue");

    let fileContent = file.contents.toString(encoding);

    let contents = parseVueToContents(fileContent, fileName, path.dirname(file.path));
    let fpath = path.dirname(file.path);

    this.push(createFile(file.base, file.cwd, fpath, fileName + ".js", contents.js));

    //如果css文件无内容，则不生成css文件
    if(contents.css.length > 0) {
        this.push(createFile(file.base, file.cwd, fpath, fileName + ".css", contents.css));
    }
    callback();

}

function createFile(base, cwd, fpath, fileName, content) {
    return new File({
        base: base,
        cwd: cwd,
        path: path.join(fpath, fileName),
        contents: new Buffer(content)
    });
}

function parseVueToContents(vueContent, fileName, filePath) {

    let scriptContents = "";
    let styleContents = "";
    let templateContents = "";

    let DomUtils = HTMLParser.DomUtils;
    let domEls = HTMLParser.parseDOM(vueContent, {lowerCaseTags: true});

    for (let i = 0, len = domEls.length; i < len; i++) {
        switch (domEls[i].name) {
            case SCRIPT:
                scriptContents = DomUtils.getText(domEls[i]);
                break;
            case TEMPLATE:
                templateContents = DomUtils.getInnerHTML(domEls[i]);
                break;
            case STYLE:
                styleContents = DomUtils.getText(domEls[i]).trim();
                break;
        }
    }

    let jsContent = convertToJSContent(scriptContents, templateContents, styleContents, fileName, filePath);

    return {
        js: jsContent,
        css: styleContents
    }
}

/**
 * 将vue文件中的内容，进行转换，生成多页引用的vue
 * @param script 脚本内容
 * @param template 模板内容
 * @param style 样式内容
 * @param fileName 文件名
 * @param filePath 文件路径
 * @returns {*}
 */
function convertToJSContent(script, template, style, fileName, filePath) {

    if (!script) {
        return "";
    }

    //兼容 windows
    filePath = filePath.replace(/\\/g, "/");

    let jsFileContent = `(function(global, Vue, undefined){
    if(!global.__FORGE_ES6_VUE_COMPONENTS__) {
        global.__FORGE_ES6_VUE_COMPONENTS__ = {};
    }
`;


    if (style && style.length > 0) {
        jsFileContent += `
    (function(){
        function getCurrentScriptBase() {
            var src = document.currentScript.src,
                lidx = src.lastIndexOf("/")
        
            return src.substring(0, lidx);
        }
        var styleLink = document.createElement('link');
        styleLink.rel = "stylesheet";
        styleLink.href = getCurrentScriptBase() + "/" + "` + fileName + `.css";
        document.head.appendChild(styleLink);
    }());\n`;
    }

    jsFileContent += processJavascript(fileName, script, processTemplate(template), style, filePath);

    jsFileContent += "\n\nglobal." + fileName + " = " + fileName + ";\n\n";

    //伪造ES6格式的VUE组件
    jsFileContent += "global.__FORGE_ES6_VUE_COMPONENTS__['" + filePath + "/" + fileName + ".vue']=" + fileName + ";\n";

    jsFileContent += "Vue.component('vue" + fileName.replace(/([A-Z])/g, "-$1").toLowerCase() + "', " + fileName + ");\n\n";

    jsFileContent += "\n}(window, Vue));";

    return jsFileContent;
}

/**
 * 转义模板
 * @param template
 * @returns {string}
 */
function processTemplate(template) {
    return "'" + template.replace(TEMPLATE_ESCAPE_REG, "\\'").replace(TEMPLATE_ESCAPE_REG2, "\\\n") + "'";
}

/**
 * 处理js  将es6写的带export的部分转换成普通的组件定义
 * @param fileName
 * @param script
 * @param processedTemplate
 * @param style
 * @returns {string|*}
 */
function processJavascript(fileName, script, processedTemplate, style, filePath) {

    script = script.replace(VUE_COMPONENT_IMPORT_REG, function (matchedLine, variableName, vuePath, index, contents) {
        return "var " + variableName + " = global.__FORGE_ES6_VUE_COMPONENTS__['" + path.resolve(filePath, vuePath).replace(/\\/g, "/") + "']";
    });

    script = script.replace(SCRIPT_REPLACER_REG, "var " + fileName + " = Vue.extend(");

    script += ");\n";


    script += fileName + ".options.template = " + processedTemplate;

    // script = script.replace(/__gvptemplate/m, processedTemplate);

    return script;

}