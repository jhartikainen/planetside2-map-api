if(!window.ps2hq) {
	window.ps2hq = { };
}

if(!ps2hq.data) {
	ps2hq.data = { };
}

ps2hq.data.SectorControl = function(options) {
	this.serviceId = options.serviceId;
};

ps2hq.data.SectorControl.prototype = {
	load: function(worldId, continent, callback) {
		var zoneId = ps2hq.data.SectorControl.ZONE_IDS[continent];
		
		//ServiceID is currently optional
		var sidPart = this.serviceId ? 's:' + this.serviceId + '/' : '';
		
		var requestId = ps2hq.data.SectorControl.requestIdCounter++;

		var url = 'http://census.soe.com/' + sidPart +
		          'get/ps2-beta/map/?world_id=' + worldId +
		          '&zone_ids=' + zoneId +
		          '&callback=ps2hq.data.SectorControl.jsonpHandler(' + requestId + ')';

		ps2hq.data.SectorControl.jsonpCallbacks[requestId] = callback;

		var script = document.createElement('script');
		script.src = url;
		document.body.appendChild(script);
	}
}

ps2hq.data.SectorControl.requestIdCounter = 0;
ps2hq.data.SectorControl.jsonpCallbacks = { };

ps2hq.data.SectorControl.jsonpHandler = function(requestId) {
	return function(data) {
		var sectors = ps2hq.data.SectorControl.processRawData(data);

		ps2hq.data.SectorControl.jsonpCallbacks[requestId](sectors);
		ps2hq.data.SectorControl.jsonpCallbacks[requestId] = null;
	};
};

ps2hq.data.SectorControl.processRawData = function(data) {
	var map = data.map_list[0];
	var zoneIds = ps2hq.data.SectorControl.ZONE_IDS;

	var continent;
	for(var key in zoneIds) {
		if(zoneIds[key] == map.ZoneId) {
			continent = key;
			break;
		}
	}

	var idMap = ps2hq.data.SECTOR_ID_MAP[continent];
	var sectors = { };
	var rows = map.Regions.Row;
	for(var i = 0; i < rows.length; i++) {
		var row = rows[i].RowData;
		sectors[idMap[row.RegionId]] = ps2hq.data.SectorControl.FACTIONS[row.FactionId];
	}

	return sectors;
};

ps2hq.data.SectorControl.FACTIONS = { 1: 'VS', 2: 'NC', 3: 'TR' };
ps2hq.data.SectorControl.ZONE_IDS = { indar: 2, amerish: 6, esamir: 8 };
