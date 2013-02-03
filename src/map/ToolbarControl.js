ps2hq.map.ToolbarControl = L.Control.extend({
	options: {
		position: 'topleft',
		selected: 'cursor'
	},

	includes: L.Mixin.Events,

	onAdd: function(map) {
		var container = L.DomUtil.create('div', 'ps2hq-control toolbar-control');

		var self = this;
		['cursor', 'pencil'].forEach(function(tool) {
			var label = document.createElement('label');

			var radio = document.createElement('input');
			radio.type = 'radio';
			radio.name = 'toolbar-tool';
			radio.value = tool;
			if(self.options.selected == tool)
				radio.checked = 'checked';
			radio.onclick = function() {
				self._changeTool(tool, map);
			};

			label.appendChild(radio);

			label.appendChild(document.createTextNode(tool));

			container.appendChild(label);
		});

		return container;
	},
	
	onRemove: function(map) {
		this._removeListeners();
	},

	_changeTool: function(tool,map) {
		this.options.selected = tool;
		this.fireEvent('changetool', { tool: tool });
		switch(tool) {
			case "cursor": 
				map.removeEventListener('mousedown', this._toolMouseDown, this);
				break;
			default:
				map.addEventListener('mousedown', this._toolMouseDown, this);
				break;
			}
	},
	
	_toolMouseDown: function(mev) {
		console.log(mev);
		console.log(this.options);
	},
	
	_toolMouseMove: function(mev) {
		
	},
	
	_toolMouseUp: function(mev) {
		
	},
	
	_removeListeners: function() {
		map.removeEventListener('mousedown', this._toolMouseDown, this);
	}
});

