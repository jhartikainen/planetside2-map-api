ps2hq.map.SectorInfoLayer = ps2hq.map.SectorLayer.extend({
	includes: L.Mixin.Events,

	initialize: function(offset) {
		this.offset = offset;
		this._sectors = sectorsIndar;
	},

	setContinent: function(continent) {
		this._sectors = ({ indar: sectorsIndar, amerish: sectorsAmerish, esamir: sectorsEsamir })[continent];
		this.onAdd();
	},

	onAdd: function(map) {
		map = map || this._map;
		this._map = map;

		var icons = [];
		var smallIcons = [];
		var sectors = this._sectors;
		for(var i = 0; i < sectors.length; i++) {
			var pg = this._generateHexes(sectors[i].hexes);
			var lats = pg.map(function(p) { return new L.LatLng(p[1], p[0]); });
			var p = new L.Polygon(lats);

			var icon = L.divIcon({ className: 'sector-name', html: sectors[i].name });
			var marker = L.marker(p.getBounds().getCenter(), { icon: icon, clickable: false });
			if(sectors[i].hexes.length < 4) {
				smallIcons.push(marker);
			}
			else {
				icons.push(marker);
			}
		}

		if(this.lg) {
			map.removeLayer(this.lg);
		}

		if(this.smallLg) {
			map.removeLayer(this.smallLg);
		}

		map.on('viewreset', this._updateIcons, this);

		this.lg = new L.LayerGroup(icons);
		this.smallLg = new L.LayerGroup(smallIcons);
		this._updateIcons();
	},

	onRemove: function(map) {
		if(this.lg) {
			map.removeLayer(this.lg);
		}

		this.lg = null;
		map.off('viewreset', this._updateIcons, this);
	},

	_updateIcons: function() {
		if(!this._map) {
			return;
		}

		var z = this._map.getZoom();
		if(z > 0) {
			this._map.addLayer(this.smallLg);
		}
		else {
			this._map.removeLayer(this.smallLg);
		}

		if(z > 0) {
			this._map.addLayer(this.lg);
		}
		else {
			this._map.removeLayer(this.lg);
		}

	},

	_reset: function() {

	}
});


