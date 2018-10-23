const rimraf = require('rimraf');
const path = require('path');
const distPath = `${path.dirname(__dirname)}/dist`;
rimraf.sync(distPath);