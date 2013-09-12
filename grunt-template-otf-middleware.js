'use strict';

var grunt = require('grunt');
var fs = require('fs');
var url = require('url');
var _ = require('lodash');
var Q = require('q');

var onTheFlyMiddleware = require('otf-render-middleware');
var fileMatches = require('file-matches');

function indexTemplateRender(options) {
  var deferred = Q.defer();

  fs.readFile(options.file, function(err, content) {
    if (err) { deferred.reject(err); }

    var data = _.result(options, 'data');
    var template;
    try{
      template = grunt.template.process(content.toString(), {
        data: data
      });
    } catch (e) {
      console.error(e);
    }

    deferred.resolve(template);
  });

  return deferred.promise;
}

function middleware(options) {
  options = _.extend({
    root: './',
    data: {},
    fileNameTransform: function fileNameTransform(filepath) {
      return filepath.replace(fileMatches.html.match, fileMatches.template.ext);
    },
    overrideCache: true,
    compile: function compile(options) {
      return indexTemplateRender(options);
    }
  }, options);

  return function angularMiddleware(req, res, next) {
    var pathname = url.parse(req.url).pathname;
    if (!fileMatches.html.match.test(pathname)) { return next(); }

    var renderOptions = onTheFlyMiddleware.getOptions(pathname, options);

    onTheFlyMiddleware.render({
      res: res,
      next: next
    }, renderOptions);
  };
}

module.exports = middleware;
