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
			continent: ps2hq.map.MapContinent.INDAR
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

ps2hq.map.MapContinent = {
	INDAR: 'indar',
	ESAMIR: 'esamir',
	AMERISH: 'amerish'
};

ps2hq.map.LayerControl = L.Control.extend({
	options: {
		position: 'topright'
	},

	includes: L.Mixin.Events,

	onAdd: function(map) {
		var container = L.DomUtil.create('div', 'layer-control');

		var self = this;
		['indar', 'esamir', 'amerish'].forEach(function(cont) {
			var label = document.createElement('label');

			var radio = document.createElement('input');
			radio.type = 'radio';
			radio.name = 'mapcontinent';
			radio.value = cont;
			radio.onclick = function() {
				self._changeContinent(cont);
			};

			label.appendChild(radio);

			label.appendChild(document.createTextNode(cont));

			container.appendChild(label);
		});

		return container;
	},

	_changeContinent: function(cont) {
		this.fireEvent('changecontinent', { continent: cont });
	}
});

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

ps2hq.map.SectorLayer = L.Class.extend({
	polyOptions: {
		fillColor: 'red',
		fillOpacity: 0.2,
		color: 'black'
	},

	includes: L.Mixin.Events,

	initialize: function(offset, options) {
		this.offset = offset;
		this.polyOptions = L.Util.extend(this.polyOptions, options);
		this._sectors = sectorsIndar;
	},

	setContinent: function(continent) {
		this._sectors = ({ indar: sectorsIndar, amerish: sectorsAmerish, esamir: sectorsEsamir })[continent];
		this.onAdd();
	},

	onAdd: function(map) {
		map = map || this._map;
		this._map = map;

		var hexes = [];
		var sectors = this._sectors;
		var self = this;
		for(var i = 0; i < sectors.length; i++) {
			(function(sector) {
				try {
					var pg = self._generateHexes(sectors[i].hexes);
					var lats = pg.map(function(p) { return new L.LatLng(p[1], p[0]); });
					var p = new L.Polygon(lats, self.polyOptions);
					p.on('click', function(ev) {
						self.fireEvent('sector-click', { sector: sector });
					});
					p.on('mouseover', function(ev) {
						self.fireEvent('sector-over', { sector: sector });
					});
					p.on('mouseout', function(ev) {
						self.fireEvent('sector-out', { sector: sector });
					});
					hexes.push(p);
				} catch(ex) { console.dir(ex); } 
			})(sectors[i]);
		}

		if(this.lg) {
			map.removeLayer(this.lg);
		}

		this.lg = new L.LayerGroup(hexes);
		map.addLayer(this.lg);
	},

	onRemove: function(map) {
		if(this.lg) {
			map.removeLayer(this.lg);
		}

		this.lg = null;
	},

	_reset: function() {

	},

	_generateHexes: function(sectors) {
		function floatComp(a, b, epsilon) {
			return Math.abs(a - b) < epsilon;
		}

		function dist(a, b) {
			return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
		}

		function findIndexes(list, line) {
			var indexes = [];
			for(var i = 0; i < list.length; i++) {
				if((dist(list[i][0], line[0]) < 0.0001 || dist(list[i][0], line[1]) < 0.0001)
				  && (dist(list[i][1], line[0]) < 0.0001 || dist(list[i][1], line[1]) < 0.0001)) {
					indexes.push(i);
				}
			}

			return indexes;
		}

		function removeDupes(list, line) {
			var indexes = findIndexes(list, line);

			if(indexes.length > 1) {
				list.splice(indexes[0], 1);
				list.splice(indexes[1] - 1, 1);
				return true;
			}

			return false;
		}

		//generate line segments for each hex border
		var xOffset = 0.731;
		var yOffset = 0.98;
		var hexWidth = 0.327;
		var hexRadius = hexWidth / Math.sqrt(3);
		var hexHeight = hexRadius * 2;

		var lines = [];
		for(var i = 0; i < sectors.length; i++) {
			var pt = sectors[i];
			var hexRowOffset = (pt.y % 2 != 0) ? hexWidth / 2 : 0;
			var hexx = ((pt.x * hexWidth) + xOffset + hexRowOffset);
			var hexy = ((pt.y * (hexRadius * 1.5)) + yOffset);

			var hexPoints = this._hexPart(hexx, hexy, hexRadius, [0,1,2,3,4,5]);
			var line = [];
			for(var j = 0; j < hexPoints.length; j++) {
				line.push(hexPoints[j]);
				if(line.length == 2) {
					lines.push(line);
					//next line starts from the end of the previous line
					line = [line[1]];
				}
			}

			//add finishing line between end of last line and start of first line of this hex
			lines.push([lines[lines.length - 1][1], lines[lines.length - 5][0]]);
		}

		//to get only the outer lines, remove all lines which appear more than once
		for(i = 0; i < lines.length; i++) {
			if(removeDupes(lines, lines[i])) {
				i--;
			}
		}

		//sort lines into order where they connect
		var start = lines.shift();
		var order = [start];
		var num = 0;
		while(lines.length) {
			var found = false;
			for(i = 0; i < lines.length; i++) {
				var pt = lines[i];
				if(dist(start[1], pt[0]) < 0.000001) {
					start = lines.splice(i, 1)[0];
					order.push(start);
					found = true;
					break;
				}
			}

			if(!found) {
				throw new Error('Line segment not found');
			}
		}
		
		//put each line's points into an array so we can then draw a line through them
		var result = [];
		for(i = 0; i < order.length; i++) {
			result.push(order[i][0]);
		}

		return result;
	},

	_hexPart: function(xPos, yPos, radius, points) {
		var p = [];
		for(var i = 0; i < points.length; i++) {
			var ptIdx = points[i];

			var a = (ptIdx * 60) + 30,
				x = radius * Math.cos(a * Math.PI / 180),
				y = radius * Math.sin(a * Math.PI / 180);

			x += xPos;
			y += yPos;

			p.push([x, y]);
		}

		return p;
	}
});

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
			try {
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
			} catch(ex) { }
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
		if(z > 2) {
			this._map.addLayer(this.smallLg);
		}
		else {
			this._map.removeLayer(this.smallLg);
		}

		if(z > 1) {
			this._map.addLayer(this.lg);
		}
		else {
			this._map.removeLayer(this.lg);
		}

	},

	_reset: function() {

	}
});

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
