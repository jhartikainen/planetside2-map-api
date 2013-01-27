ps2hq.map.TileLayer = L.TileLayer.extend({
	options: {
		minZoom: 0,
		maxZoom: 5,
		zoomReverse: true,
		continuousWorld: true
	},
	url: 'http://map-images.ps2hq.com/{continent}/{z}/t_{continent}_{y}_{x}.jpg',

	initialize: function(continent) {
		if(!continent) {
			throw new Error('Must specify continent');
		}

		this._continent = continent;
	},

	getTileUrl: function(pt) {
		this._adjustTilePoint(pt);

		var z = this._getZoomForUrl();
		var url = this._url || this.url;

		if(z == 0) {
			url = 'http://map-images.ps2hq.com/{continent}/t_{continent}_{y}_{x}.jpg';
		}

		var scale = 2 << (4 - z);
		var x = pt.x + 1;
		var y = pt.y + 1;
		if(scale > 9) {
			if(x < 10) {
				x = '0' + x;
			}

			if(y < 10) {
				y = '0' + y;
			}
		}

		return L.Util.template(url, L.Util.extend({
			s: this._getSubdomain(pt),
			z: this._getZoomForUrl(),
			x: x,
			y: y,
			continent: this._continent
		}));
	}
});


