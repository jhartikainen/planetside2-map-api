var build = require('./build/build.js');
var generator = require('./build/generator.js');

desc('Build');
task('build', build.build);

desc('Generate sector ID mapping');
task('gen-sectormap', generator.genSectorMap);

task('default', ['build']);
