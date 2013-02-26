var fs = require('fs');
var sqwish = require('sqwish');
var uglify = require('uglify-js');

var buildJs = function() {
	var files = [
		'lib/leaflet-0.5-src.js',
		'src/sectors.js',
		'src/sectors-amerish.js',
		'src/sectors-esamir.js',
		'src/Map.js',
		'src/map/TileLayer.js',
		'src/map/SectorLayer.js',
		'src/map/SectorInfoLayer.js',
		'src/map/ContinentControl.js',
		'src/map/LayerControl.js',
		'src/map/GridLayer.js',
		'src/data/SectorControl.js',
		'src/data/sector-id-map.js'
		'src/map/SectorHelper.js',
	];

	var head = '(function(window, document, undefined) {';
	var tail = '})(window, document);';

	var contents = files.map(function(file) {
		return fs.readFileSync(file, 'utf8') + '\n\n';
	});

	var src = head + contents.join('') + tail;
	fs.writeFileSync('dist/ps2hq-src.js', src);
	fs.writeFileSync('dist/ps2hq.js', uglify(src, { warnings: true, fromString: true }));
};

var buildCss = function() {
	var files = [
		'lib/leaflet.css',
		'src/map-styles.css'
	];

	var contents = files.map(function(file) {
		return fs.readFileSync(file, 'utf8') + '\n\n';
	});

	var src = contents.join('');
	fs.writeFileSync('dist/ps2hq-src.css', src);
	fs.writeFileSync('dist/ps2hq.css', sqwish.minify(src));
};

exports.build = function() {
	buildJs();
	buildCss();
};
