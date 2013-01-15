if(!window.ps2hq) {
	window.ps2hq = { };
}

L.LatLng2 = function (rawLat, rawLng, noWrap) {
  //Specify the default
  if(typeof noWrap == "undefined")
    noWrap = true;

  //Read the lat/longs
	var lat = parseFloat(rawLat),
		  lng = parseFloat(rawLng);

  //Throw errors
	if (isNaN(lat) || isNaN(lng)) {
		throw new Error('Invalid LatLng object: (' + rawLat + ', ' + rawLng + ')');
	}

  //Bound the coords to standard lat/long
	if (noWrap !== true) {
		lat = Math.max(Math.min(lat, 90), -90);					// clamp latitude into -90..90
		lng = (lng + 180) % 360 + ((lng < -180 || lng === 180) ? 180 : -180);	// wrap longtitude into -180..180
	}

  //Update
	this.lat = lat;
	this.lng = lng;
};

var SquareMapTransform = L.Transformation.extend({
  //Tell the transformer the appropriate information
	initialize: function (width, height, topmargin, rightmargin, bottommargin, leftmargin) {
		this._x = 1/(width);
		this._y = 1/(height);

    this._left = this._x *leftmargin;
		this._top = this._y * topmargin;
		this._bottom = this._y * bottommargin;
		this._right = this._x * rightmargin;
	},

	//Transform from point to lat
	_transform: function (/*Point*/ point, /*Number*/ scale) /*-> Point*/ {
		scale = scale || 1; 
		var xPoint = scale * (this._x * point.x); //where it is without anything
		var margins = (1-this._left) * (1-this._right) * xPoint; //take into account margins (squash)
		point.x = margins + (scale * this._left); //add top margin
		
		var yPoint = scale * (this._y * point.y); //where it is without anything
		margins = (1-this._top) * (1-this._bottom) * yPoint; //take into account margins (squash)
		point.y = margins + (scale * this._top); //add top margin
		
		return point;
	},
  
  //Transform from lat to point
	untransform: function (/*Point*/ point, /*Number*/ scale) /*-> Point*/ {
		scale = scale || 1; 

		margins = point.x - (scale * this._left); //add top margin
		xPoint = margins/((1-this._left) * (1-this._right)); //take into account margins (squash)
		x = xPoint / (scale * this._x); //where it is without anything
		
		margins = point.y - (scale * this._top); //add top margin*/
		yPoint = margins / ((1-this._top) * (1-this._bottom)); //take into account margins (squash)
		y = yPoint / (scale * this._y); //where it is without anything
		
		return new L.Point(x, y);
	}
}); 


ps2hq.Map = function(container) {
	this.map = L.map(container, {
		continuousWorld: true,
		worldCopyJump: false
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

		console.log(z);
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
};

ps2hq.Map.prototype = {

};
