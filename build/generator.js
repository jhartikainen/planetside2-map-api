var request = require('request');
var fs = require('fs');
var uglify = require('uglify-js');

/**
 * This generates a mapping of sector IDs from SOE APIs to a sector name.
 * Used to figure out which sector in our code matches which id in SOE API.
 */
exports.genSectorMap = function() {
	var results = { };
	request({ url: 'http://census.soe.com/get/ps2-beta/indarmap/', qs: { 'c:limit': 100 } }, function(err, res) {
		results.indar = processSectors(JSON.parse(res.body).indarmap_list);
		ok();
	});
	request({ url: 'http://census.soe.com/get/ps2-beta/esamirmap/', qs: { 'c:limit': 100 } }, function(err, res) {
		results.esamir = processSectors(JSON.parse(res.body).esamirmap_list);
		ok();
	});
	request({ url: 'http://census.soe.com/get/ps2-beta/amerishmap/', qs: { 'c:limit': 100 } }, function(err, res) {
		results.amerish = processSectors(JSON.parse(res.body).amerishmap_list);
		ok();
	});

	var ok = function() {
		if(results.indar && results.esamir && results.amerish) {
			fs.writeFileSync('src/data/sector-id-map.js', 'ps2hq.data.SECTOR_ID_MAP = ' + JSON.stringify(results) + ';');
		}
	}
};

function processSectors(sectors) {
	var mapping = { };
	sectors.forEach(function(sector) {
		mapping[sector.region_id] = sector.facility.en;
	});

	return mapping;
}
