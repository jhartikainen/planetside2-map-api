ps2hq.map.LayerControl = L.Control.extend({
	options: {
		position: 'topright'
	},

	includes: L.Mixin.Events,

	onAdd: function(map) {
		var self = this;
		var createInput = function(name, option, trigger) {
			option = option || name.toLowerCase();
			trigger = trigger || name;
			var label = document.createElement('label');

			var check = document.createElement('input');
			check.type = 'checkbox';
			check.checked = self._map.options[option];
			check.onclick = function(ev) {
				self._map['show' + trigger](this.checked);
			};

			label.appendChild(check);

			label.appendChild(document.createTextNode(name));

			return label;
		}

		var container = L.DomUtil.create('div', 'ps2hq-control layer-control');
		L.DomEvent.disableClickPropagation(container);

		container.appendChild(createInput('Grid'));
		container.appendChild(createInput('Sectors'));
		container.appendChild(createInput('Sector labels', 'sectorLabels', 'SectorLabels'));

		return container;
	}
});


