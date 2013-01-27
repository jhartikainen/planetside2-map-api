if(!window.ps2hq) {
	window.ps2hq = { };
}

if(!ps2hq.map) {
	ps2hq.map = { };
}

ps2hq.Map = L.Map.extend({
	options: {
		continuousWorld: true,
		worldCopyJump: false,
		crs: L.Util.extend({}, L.CRS, {
			code: 'asf',
			projection: L.Projection.LonLat,
			transformation: new L.Transformation(1, 0, 1, 0),
			scale: function(zoom) {
				//0.03125 = number of units per tile = 256 / 8192
				//256 = tile size, 8192 = total map size
				return 1 / (0.03125 / Math.pow(2, zoom));
			}		
		})
	},

	_tilelayers: { },
	_currentTilelayer: null,
	_sectorLayer: null,
	_sectorsVisible: false,
	_infoLayer: null,

	initialize: function(container, options) {
		options = L.Util.extend({
			sectors: true,
			sectorLabels: true,
			grid: true,
			continent: 'indar'
		}, options);

		L.Map.prototype.initialize.call(this, container);
		this.on('click', function(ev) {
			console.log(ev.latlng.toString());
		});
		this.setView([0, 0], 3);

		this._tilelayers = {
			indar: new ps2hq.map.TileLayer('indar'),
			esamir: new ps2hq.map.TileLayer('esamir'),
			amerish: new ps2hq.map.TileLayer('amerish')
		};

		var self = this;
		this._sectorLayer = new ps2hq.map.SectorLayer();
		this._sectorLayer.on('sector-over', function(ev) {
			self.fireEvent('sector-over', ev);
		});
		this._sectorLayer.on('sector-click', function(ev) {
			self.fireEvent('sector-click', ev);
		});
		this._sectorLayer.on('sector-out', function(ev) {
			self.fireEvent('sector-out', ev);
		});
		this.showSectors(options.sectors);

		this._infoLayer = new ps2hq.map.SectorInfoLayer();
		this.showSectorLabels(options.sectors && options.sectorLabels);

		this.setContinent(options.continent);

		var layersCtrl = new ps2hq.map.LayerControl();
		layersCtrl.on('changecontinent', function(ev) {
			self.setContinent(ev.continent);
		});
		layersCtrl.addTo(this);

		var canvasTiles = L.tileLayer.canvas();
		canvasTiles.drawTile = function(canvas, tilePoint, zoom) {
			var ctx = canvas.getContext('2d');
			ctx.strokeStyle = ctx.fillStyle = "red";
			ctx.rect(0,0, 256,256);
			ctx.stroke();
			ctx.fillText('(' + tilePoint.x + ', ' + tilePoint.y + ')',5,10);
		};
		//canvasTiles.addTo(this);

		this._gridLayer = new ps2hq.map.GridLayer();
		this.showGrid(options.grid);
	},

	_toggleLayer: function(visible, layer) {
		if(visible) {
			this.addLayer(layer);
		}
		else {
			this.removeLayer(layer);
		}
	},

	showGrid: function(show) {
		this._toggleLayer(show, this._gridLayer);
	},

	showSectors: function(show) {
		this._toggleLayer(show, this._sectorLayer);
	},

	showSectorLabels: function(show) {
		this._toggleLayer(show, this._infoLayer);
	},

	setContinent: function(continent) {
		if(this._currentTilelayer) {
			this.removeLayer(this._currentTilelayer);
		}

		this.addLayer(this._tilelayers[continent]);

		this._currentTilelayer = this._tilelayers[continent];

		this._sectorLayer.setContinent(continent);
		this._infoLayer.setContinent(continent);
	}
});

