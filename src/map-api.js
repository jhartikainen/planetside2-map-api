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

	initialize: function(container, options) {
		options = L.Util.extend({
			sectors: true,
			continent: ps2hq.map.MapContinent.INDAR
		}, options);

		L.Map.prototype.initialize.call(this, container);
		this.on('click', function(ev) {
			console.log(ev.latlng.toString());
		});
		this.setView([0, 0], 3);


		var canvasTiles = L.tileLayer.canvas();
		canvasTiles.drawTile = function(canvas, tilePoint, zoom) {
			var ctx = canvas.getContext('2d');
			ctx.strokeStyle = ctx.fillStyle = "red";
			ctx.rect(0,0, 256,256);
			ctx.stroke();
			ctx.fillText('(' + tilePoint.x + ', ' + tilePoint.y + ')',5,10);
		};
		//canvasTiles.addTo(this.map);

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

		this.setContinent(options.continent);

		var layersCtrl = new ps2hq.map.LayerControl();
		layersCtrl.on('changecontinent', function(ev) {
			self.setContinent(ev.continent);
		});
		layersCtrl.addTo(this);

		this.addLayer(new ps2hq.map.SectorInfoLayer());
	},

	showSectors: function(show) {
		if(show) {
			if(!this._sectorsVisible) {
				this.addLayer(this._sectorLayer);
			}
		}
		else {
			if(this._sectorsVisible) {
				this.removeLayer(this._sectorLayer);
			}
		}

		this._sectorsVisible = !!show;
	},

	setContinent: function(continent) {
		if(this._currentTilelayer) {
			this.removeLayer(this._currentTilelayer);
		}

		this.addLayer(this._tilelayers[continent]);

		this._currentTilelayer = this._tilelayers[continent];

		this._sectorLayer.setContinent(continent);
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

		function flatten(hexgroup) {
			var result = [];
			for(var i = 0; i < hexgroup.length; i++) {
				var hex = hexgroup[i];
				for(var j = 0; j < hex.length; j++) {
					result.push(hex[j]);
				}
			}

			return result;
		}

		var hexes = [];
		var sectors = this._sectors;
		var self = this;
		for(var i = 0; i < sectors.length; i++) {
			(function(sector) {
				try {
					var pg = self._hexGroup(sector.hexes);
					var lats = flatten(pg).map(function(p) { return new L.LatLng(p[1], p[0]); });
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
				} catch(ex) { console.log(ex); } 
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

	_hexGroup: function(points) {
		function setNeighbors(pt, points) {
			//determine which hexes are adjacent to this one
			var topLeft = {
				x: pt.y % 2 == 0 ? pt.x - 1 : pt.x,
				y: pt.y - 1
			};

			var topRight = {
				x: pt.y % 2 == 0 ? pt.x : pt.x + 1,
				y: pt.y - 1
			};

			var right = {
				x: pt.x + 1,
				y: pt.y
			}

			var left = {
				x: pt.x - 1,
				y: pt.y
			}

			var bottomLeft = {
				x: pt.y % 2 == 0 ? pt.x - 1 : pt.x,
				y: pt.y + 1
			};

			var bottomRight = {
				x: pt.y % 2 == 0 ? pt.x : pt.x + 1,
				y: pt.y + 1
			};

			//neighbor directions from 0 to 5
			var dirs = [topLeft, topRight, right, bottomRight, bottomLeft, left];

			pt.neighbors = { };
			pt.points = [];
			//determine if any hexes are adjacent to this, and direction
			for(var i = 0; i < points.length; i++) {
				var otherPoint = points[i];
				for(var dir = 0; dir < dirs.length; dir++) {
					if(dirs[dir].x == otherPoint.x && dirs[dir].y == otherPoint.y) {
						pt.neighbors[dir] = otherPoint;
					}
				}
			}

			return pt;
		}

		//clone objects so we don't smash anything unintentionally
		var initPts = points;

		var wNeighbors = initPts.map(function(pt) { return setNeighbors(pt, initPts); });
		//console.dir(wNeighbors);

		var dir = 0, hex;

		var hexesWithPts = [];

		//which points map to which direction
		var dirPoints = [3, 4, 5, 0, 1, 2];

		var limit = 1000;
		//iterate edge of hex group until we reach back to first hex
		while(hex != wNeighbors[0]) {
			limit--;
			if(!limit) {
				throw new Error('Algorithm failed');
			}

			if(!hex) {
				hex = wNeighbors[0];
			}

			var next = null;

			//this will cause the same hex to be added into the group multiple times,
			//but as we are essentially doing step-by-step drawing it's fine.
			//if we were to add all points to the same object, it would draw the line wrong.
			hexesWithPts.push({
				x: hex.x,
				y: hex.y,
				points: []
			});

			//find next hex, clockwise along the edge
			var dirsTried = 0;
			while(!next) {
				if(dirsTried == 6) {
					throw new Error('Found no neighbors?');
				}

				next = hex.neighbors[dir];

				//add points along the outer edge for dirs traversed
				hexesWithPts[hexesWithPts.length - 1].points.push(dirPoints[dir]);

				dir++;
				dirsTried++;
				if(dir > 5) {
					dir = 0;
				}
			}

			//go back two to get to a dir one before the one tried last
			//so any hexes on the sides of the next one get picked correctly
			dir -= 2;
			if(dir < 0) {
				dir = 6 - Math.abs(dir);
			}

			hex = next;
		}

		//add finishing points to first hex of group
		if(dir == 0) {
			//if last hex was down and left, don't draw bottom point
			hexesWithPts.push({
				x: wNeighbors[0].x,
				y: wNeighbors[0].y,
				points: [2, 3]
			});
		}
		else {
			//otherwise bottom point must be included
			hexesWithPts.push({
				x: wNeighbors[0].x,
				y: wNeighbors[0].y,
				points: [1, 2, 3]
			});
		}


		var path = '';
		var xOffset = 0.731;
		var yOffset = 0.98;
		//var hexWidth = 0.26;
		var hexWidth = 0.327;
		//var hexHeight = 0.24;
		//var hexRadius = 0.15;
		var hexRadius = hexWidth / Math.sqrt(3);
		var hexHeight = hexRadius * 2;

		var points = [];
		for(var i = 0; i < hexesWithPts.length; i++) {
			var pt = hexesWithPts[i];
			var hexRowOffset = (pt.y % 2 != 0) ? hexWidth / 2 : 0;
			var hexx = ((pt.x * hexWidth) + xOffset + hexRowOffset);
			var hexy = ((pt.y * (hexRadius * 1.5)) + yOffset);

			points.push(this._hexPart(hexx, hexy, hexRadius, pt.points, i == 0));
		}

		return points;
	},

	_hexPart: function(xPos, yPos, radius, points, first) {
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

		function flatten(hexgroup) {
			var result = [];
			for(var i = 0; i < hexgroup.length; i++) {
				var hex = hexgroup[i];
				for(var j = 0; j < hex.length; j++) {
					result.push(hex[j]);
				}
			}
			return result;
		}

		var icons = [];
		var smallIcons = [];
		var sectors = this._sectors;
		for(var i = 0; i < sectors.length; i++) {
			try {
				var pg = this._hexGroup(sectors[i].hexes);
				var lats = flatten(pg).map(function(p) { return new L.LatLng(p[1], p[0]); });
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
