ps2hq.map.SectorHelper = {
	autoUpdateSectors: function(map, options) {
		interval = interval || 60;

		var worldId = options.worldId;
		var serviceId = options.serviceId;
		var interval = options.interval || 60;

		var factionColors = { TR: 'red', NC: 'blue', VS: 'purple' };

		var colorHexes = function(data) {
			for(var name in data) {
				var faction = data[name];
				var sector = map.getSectorByName(name);
				if(sector) {
					sector.poly.setStyle({ fillColor: factionColors[faction] });
				}
			}
		};
		sec = new ps2hq.data.SectorControl({ serviceId: serviceId });
		sec.load(worldId, map.getContinent(), colorHexes);

		map.on('change-continent', function(ev) {
			sec.load(worldId, ev.continent, colorHexes);
		});

		return setInterval(function() {
			sec.load(worldId, map.getContinent(), colorHexes);
		}, interval * 1000);
	},

	stopAutoUpdateSectors: function(timer) {
		clearInterval(timer);
	}
};
