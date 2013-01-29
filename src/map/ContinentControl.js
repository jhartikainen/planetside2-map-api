ps2hq.map.ContinentControl = L.Control.extend({
	options: {
		position: 'topright'
	},

	includes: L.Mixin.Events,

	onAdd: function(map) {
		var container = L.DomUtil.create('div', 'ps2hq-control continent-control');

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

