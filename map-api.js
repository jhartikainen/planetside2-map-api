if(!window.ps2hq) {
	window.ps2hq = { };
}

ps2hq.Map = function(container) {
	var scale = function(zoom) {
		//0.03125 = number of units per tile = 256 / 8192
		//256 = tile size, 8192 = total map size
		return 1 / (0.03125 / Math.pow(2, zoom));
	};

	this.map = L.map(container, {
		continuousWorld: true,
		worldCopyJump: false,
		scale: scale,
		crs: L.Util.extend({}, L.CRS, {
			code: 'asf',
			projection: L.Projection.LonLat,
			transformation: new L.Transformation(1, 0, 1, 0),
			scale: scale
		})
	});

	this.map.on('click', function(ev) {
		console.log(ev.latlng.toString());
	});
	/*, { 
		worldCopyJump: false,
		continuousWorld: true,
		crs: L.Util.extend({}, L.CRS, { 
			code: 'Lol',
			projection: L.Projection.LonLat,
			transformation: new SquareMapTransform(64, 64, 1, 64, 64, 1)
		})/*,
		scale: function(zoom) {
			return 1 / (0.03125 / Math.pow(2, zoom));
		}*/
	/*});*/
	this.map.setView([0, 0], 3);

	var l = L.tileLayer('http://map-images.ps2hq.com/indar/{z}/t_indar_{y}_{x}.jpg', {
		minZoom: 0,
		maxZoom: 5,
		zoomReverse: true,
		continuousWorld: true
	});

	l.getTileUrl = function(pt) {
		this._adjustTilePoint(pt);

		var z = this._getZoomForUrl();
		var url = this._url;

		if(z == 0) {
			url = 'http://map-images.ps2hq.com/indar/t_indar_{y}_{x}.jpg';
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
			   y: y
		}));
	};
	
	l.addTo(this.map);
	var canvasTiles = L.tileLayer.canvas();
	canvasTiles.drawTile = function(canvas, tilePoint, zoom) {
		var ctx = canvas.getContext('2d');
		ctx.strokeStyle = ctx.fillStyle = "red";
		ctx.rect(0,0, 256,256);
		ctx.stroke();
		ctx.fillText('(' + tilePoint.x + ', ' + tilePoint.y + ')',5,10);
	};
	//canvasTiles.addTo(this.map);
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

	for(var i = 0; i < sectors.length; i++) {
		try {
		var pg = this.hexGroup(sectors[i].hexes);
		console.log(pg);
		//console.dir(_.flatten(pg, true));
		var lats = flatten(pg).map(function(p) { return new L.LatLng(p[1], p[0]); });
		//console.dir(lats);
		//var p = new R.Polygon(lats);
		var p = new L.Polygon(lats, {
			fill: true,
			fillColor: 'red'
		});
		p.on('click', function(ev) {
			console.log(ev.latlng.toString());
		});
		this.map.addLayer(p);
		} catch(ex) { console.log(ex); } 
	}
};

ps2hq.Map.prototype = {
	hexGroup: function(points) {
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

			points.push(this.hexPart(hexx, hexy, hexRadius, pt.points, i == 0));
		}

		return points;
	},

	hexPart: function(xPos, yPos, radius, points, first) {
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
};
