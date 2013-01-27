# ps2hq.com map API

## Usage

### Creating a map

    var map = new ps2hq.Map('myMapContainer');

Where `'myMapContainer'` is the ID of your map container element. The container must have a height defined!

### Configuring the map

You can pass additional options to the constructor.

Available options are:

- `sectors`: boolean, display sectors true/false
- `sectorLabels`: boolean, display sector labels true/false
- `grid`: boolean, display grid true/false

For example:

    var map = new ps2hq.Map('myMapContainer', { sectorLabels: false });

### Changing map settings after construction

    map.showSectors(false);
    map.showSectorLabels(false);
    map.showGrid(false);

