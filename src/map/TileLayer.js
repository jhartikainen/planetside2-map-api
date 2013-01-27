ps2hq.map.TileLayer = L.TileLayer.extend({
	options: {
		minZoom: -2,
		maxZoom: 5,
		zoomOffset: -2,
		zoomReverse: true,
		continuousWorld: true
	},
	_url: 'http://www.weendy.dk/maps/indar/{z}/indar_tile_{x}_{y}.jpg',

	initialize: function(continent) {
		if(!continent) {
			throw new Error('Must specify continent');
		}

		this._continent = continent;
	}
});


