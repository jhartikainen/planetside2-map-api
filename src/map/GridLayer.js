ps2hq.map.GridLayer = L.Class.extend({
	includes: L.Mixin.Events,

	_fg: null,
	_lg: null,
	_lineStyles: null,

	initialize: function(lineStyles) {
		this._lineStyles = lineStyles || {};
	},

	setContinent: function(continent) {
	},

	onAdd: function(map) {
		this.onRemove();

		this._map = map;

		var latlngs = [];
		var aCode = 'A'.charCodeAt(0);
		var row = 1;
		var labels = [];
		for(var i = 0; i <= 8; i += 0.5) {
			latlngs.push([new L.LatLng(i, 0), new L.LatLng(i, 8)]);
			latlngs.push([new L.LatLng(0, i), new L.LatLng(8, i)]);

			if(row < 17) {
				var icon = L.divIcon({ className: 'sector-name', html: row });
				var marker = L.marker(new L.LatLng(i + 0.25, -0.25), { icon: icon, clickable: false });
				labels.push(marker);

				var icon = L.divIcon({ className: 'sector-name', html: String.fromCharCode(aCode + row - 1) });
				var marker = L.marker(new L.LatLng(-0.25, i + 0.25), { icon: icon, clickable: false });
				labels.push(marker);
			}
			row++;
		}

		this._lg = new L.LayerGroup(labels);

		this._fg = new L.MultiPolyline(latlngs, L.Util.extend({
			color: 'white',
			opacity: 0.5,
			weight: 2,
			clickable: false
		}, this._lineStyles));

		this._map.addLayer(this._fg);
		this._map.addLayer(this._lg);
	},

	onRemove: function(map) {
		if(this._fg) {
			this._map.removeLayer(this._fg);
		}

		if(this._lg) {
			this._map.removeLayer(this._lg);
		}

		this._fg = null;
		this._lg = null;
		this._map = null;
	},

	_reset: function() {

	}
});

