if(!window.ps2hq) {
	window.ps2hq = { };
}

if(!ps2hq.map) {
	ps2hq.map = { };
}

ps2hq.Map = L.Map.extend({
	options: {
		sectors: true,
		sectorLabels: true,
		grid: true,
		continent: 'indar',
		zoom: 0,
		center: new L.LatLng(4, 4),
		continuousWorld: true,
		worldCopyJump: false,
		crs: L.Util.extend({}, L.CRS, {
			code: 'asf',
			projection: L.Projection.LonLat,
			transformation: new L.Transformation(1, -4, 1, -4),
			scale: function(zoom) {
				//calculate number of units per tile for scaler = tile width / total map width
				//256 = tile size, 32768 = total map size
				return 1 / ((256 / 32768) / Math.pow(2, zoom));
			}		
		})
	},

	_tilelayers: { },
	_currentTilelayer: null,
	_sectorLayer: null,
	_sectorsVisible: false,
	_infoLayer: null,

	initialize: function(container, options) {
		this.options = L.Util.extend(this.options, options);

		L.Map.prototype.initialize.call(this, container, this.options);
		this.on('click', function(ev) {
			console.log(ev.latlng.toString());
		});

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
		this.showSectors(this.options.sectors);

		this._infoLayer = new ps2hq.map.SectorInfoLayer();
		this.showSectorLabels(this.options.sectors && this.options.sectorLabels);

		this.setContinent(this.options.continent);

		var continentControl = new ps2hq.map.ContinentControl();
		continentControl.on('changecontinent', function(ev) {
			self.setContinent(ev.continent);
		});
		continentControl.addTo(this);
		
		var toolbarControl = new ps2hq.map.ToolbarControl();
		toolbarControl.on('changetool', function(ev) {
			
		});
		toolbarControl.addTo(this);

		var layerControl = new ps2hq.map.LayerControl();
		layerControl.addTo(this);

		this.attributionControl.setPrefix('Powered by <a href="http://ps2hq.com/apis/map">ps2hq map API</a>');

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
		this.showGrid(this.options.grid);
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


