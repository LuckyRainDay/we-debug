const path = require('path');
const lead = require('lead');
const pumpify = require('pumpify');
const through = require('through2');
const PluginError = require('plugin-error');
const { lookupPages } = require('./lib/lookup');
const { belongsPage, belongsApp } = require('./lib/belongs');
const { getAbsolutePath } = require('./lib/path');
const injectComponentId = require('./lib/inject-component-id');

const PLUGIN_NAME = '@we-debug/gulp-tool';

let pages = [];

function mpGlobalComp(options = {}) {
  //
  let baseDir = options.baseDir || 'src';
  const wxmlRaw = options.wxml || '<we-debug />';
  const filter = options.filter || '';
  let compName = options.compName || 'we-debug';
  let compPath = options.compPath || '@we-debug/core/component/index/index';
  let entryFile = options.entryFile || 'we-debug/index.js';

  baseDir = getAbsolutePath(baseDir);
  const isModule = compPath.indexOf('@we-debug/core') === 0;

  if (!isModule && path.isAbsolute(compPath)) {
    compPath = path.relative(baseDir, compPath);
  }

  if (path.isAbsolute(entryFile)) {
    entryFile = path.relative(baseDir, entryFile);
  }

  /**
   * 初始化设置
   *
   */
  function init() {
    return through.obj((file, encoding, callback) => {
      if (!mpGlobalComp.init) {
        try {
          pages = lookupPages(baseDir);
        } catch (e) {
          throw new PluginError(PLUGIN_NAME, 'look up pages failed, please check your configure');
        }
        mpGlobalComp.init = true;
      }
      callback(null, file);
    });
  }

  function parseWxml() {
    return through.obj((file, encoding, callback) => {
      if (file.isNull()) return callback(null, file);

      // 如果不是 wxml 文件, 则跳过
      if (file.extname !== '.wxml') return callback(null, file);

      // 如果命中filter，则跳过
      if (filter) {
        const pathStr = file.path.split(path.sep).join('/'); // 兼容不同操作系统的路径分隔符
        if (Array.isArray(filter)) {
          const result = filter.some(item => {
            return isDoFilter(item, pathStr);
          });
          if (result) return callback(null, file);
        } else {
          if (isDoFilter(filter, pathStr)) return callback(null, file);
        }
      }

      // 如果属于 Page
      if (belongsPage(file.path, pages)) {
        let code = file.contents.toString();

        code += wxmlRaw;

        file.contents = Buffer.from(code);
      }

      callback(null, file);
    });
  }

  /**
   * 是否需要过滤
   * @returns [Boolean] true-需要过滤；false-不需要过滤
   */
  function isDoFilter(filter, path) {
    return (
      (typeof filter === 'function' && !filter(path)) ||
      (typeof filter === 'string' && path.indexOf(filter) >= 0) ||
      (filter instanceof RegExp && filter.test(path))
    );
  }

  /**
   * 处理 json
   *
   */
  function parseJson() {
    return through.obj((file, encoding, callback) => {
      if (file.isNull()) return callback(null, file);

      // 如果不是 wxml 文件, 则跳过
      if (file.extname !== '.json') return callback(null, file);

      // 如果是 app.json
      if (belongsApp(file.path, baseDir)) {
        let code = file.contents.toString();

        try {
          const json = JSON.parse(code);

          if (!json.usingComponents) {
            json.usingComponents = {};
          }
          json.usingComponents[compName] = compPath;

          code = JSON.stringify(json, null, 2);
        } catch (e) {
          throw new PluginError(PLUGIN_NAME, e);
        }

        file.contents = Buffer.from(code);
      }

      callback(null, file);
    });
  }

  /**
   * 处理 js
   *
   * @returns
   */
  function parseScript() {
    return through.obj((file, encoding, callback) => {
      if (file.isNull()) return callback(null, file);

      // 如果不是 JS 文件, 则跳过
      if (file.extname !== '.js') return callback(null, file);

      // 如果是 app.js
      if (belongsApp(file.path, baseDir) || file.relative === 'app.js') {
        let code = file.contents.toString();

        code = `require('${entryFile}')\n` + code;
        file.contents = Buffer.from(code);
      }

      callback(null, file);
    });
  }

  const pipeline = [init(), parseWxml(), parseJson(), parseScript()];

  return lead(pumpify.obj(pipeline));
}

mpGlobalComp.injectComponentId = injectComponentId;

module.exports = mpGlobalComp;
