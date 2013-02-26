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
				var pg = self._generateHexes(sectors[i].hexes);
				var lats = pg.map(function(p) { return new L.LatLng(p[1], p[0]); });
				var p = new L.Polygon(lats, self.polyOptions);
				p.on('click', function(ev) {
					ev.sector = sector;
					self.fireEvent('sector-click', ev);
				});
				p.on('mouseover', function(ev) {
					ev.sector = sector;
					self.fireEvent('sector-over', ev);
				});
				p.on('mouseout', function(ev) {
					ev.sector = sector;
					self.fireEvent('sector-out', ev);
				});
				sector.poly = p;
				hexes.push(p);
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

	getSectorByName: function(name) {
		for(var i = 0; i < this._sectors.length; i++) {
			if(this._sectors[i].name == name) {
				return this._sectors[i];
			}
		}

		return null;
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


