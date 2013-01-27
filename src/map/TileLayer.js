ps2hq.map.TileLayer = L.TileLayer.extend({
	options: {
		minZoom: -2,
		maxZoom: 5,
		zoomOffset: -2,
		zoomReverse: true,
		continuousWorld: true
	},
	_url: 'http://www.weendy.dk/maps/{continent}/{z}/{continent}_tile_{x}_{y}.jpg',

	initialize: function(continent) {
		if(!continent) {
			throw new Error('Must specify continent');
		}

		//use util.extend to clone options since otherwise it's shared between instances
		this.options = L.Util.extend({ continent: continent }, this.options);
	},

	_tileShouldBeLoaded: function(tile) {
		//get the number of tiles per zoom
		var numTiles = 4 << this._map.getZoom();

		//tile nums are split between negatives and positives so need min/max like this
		var max = numTiles / 2;
		var min = max * -1;

		return tile.x >= min && tile.x < max && tile.y >= min && tile.y < max;
	}
});


