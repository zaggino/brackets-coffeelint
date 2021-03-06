/*eslint no-process-env:0, new-cap:0*/
/*global require, exports*/

(function () {
  'use strict';

  var fs = require('fs');
  var CoffeeScript = require('coffee-script');
  var CoffeeLint = require('coffeelint/lib/coffeelint');
  var Configfinder = require('coffeelint/lib/configfinder');

  var currentConfig;
  var currentProjectRoot;
  var domainName = 'zaggino.brackets-coffeelint';
  var domainManager = null;
  var noop = function () {};

  function _setProjectRoot(projectRoot) {
    // set it to empty in case reading coffeelint.json fails
    currentConfig = null;
    // read coffeelint.json from current project
    if (!projectRoot) { return; }
    var configFilePath = projectRoot + 'coffeelint.json';
    try {
      if (fs.statSync(configFilePath).isFile()) {
        currentConfig = JSON.parse(fs.readFileSync(configFilePath, {encoding: 'utf-8'}));
      }
    } catch (e) {
      // no action required
      noop(e);
    }
  }

  require('enable-global-packages').on('ready', function () {
    // global packages are available now
    _setProjectRoot(currentProjectRoot);
  });

  function lintFile(fullPath, projectRoot) {
    if (projectRoot !== currentProjectRoot) {
      _setProjectRoot(projectRoot);
      currentProjectRoot = projectRoot;
    }
    var errorReport = new CoffeeLint.getErrorReport();
    var source = fs.readFileSync(fullPath, {encoding: 'utf-8'});
    var config = currentConfig || Configfinder.getConfig(fullPath);
    var literate = CoffeeScript.helpers.isLiterate(fullPath);
    errorReport.lint(fullPath, source, config, literate);
    return errorReport.getErrors(fullPath);
  }

  exports.init = function (_domainManager) {
    domainManager = _domainManager;

    if (!domainManager.hasDomain(domainName)) {
      domainManager.registerDomain(domainName, {
        major: 0,
        minor: 1
      });
    }

    domainManager.registerCommand(
      domainName,
      'lintFile', // command name
      lintFile, // handler function
      false, // is not async
      'lint given file with eslint', // description
      [
        {
          name: 'fullPath',
          type: 'string'
        },
        {
          name: 'projectRoot',
          type: 'string'
        }
      ], [
        {
          name: 'report',
          type: 'object'
        }
      ]
    );

  };

}());
