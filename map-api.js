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

	this.map.on('mousemove', function(ev) {
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
};

ps2hq.Map.prototype = {

};
