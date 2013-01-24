var fs = require('fs');

exports.build = function() {
	var files = [
		'lib/leaflet-0.5-src.js',
		'src/sectors.js',
		'src/sectors-amerish.js',
		'src/sectors-esamir.js',
		'src/map-api.js'
	];

	var head = '(function(window, document, undefined) {';
	var tail = '})(window, document);';

	var contents = files.map(function(file) {
		return fs.readFileSync(file, 'utf8') + '\n\n';
	});

	fs.writeFileSync('dist/ps2hq.js', head + contents.join('') + tail);
};
