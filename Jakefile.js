var build = require('./build/build.js');

desc('Build');
task('build', build.build);

task('default', ['build']);
