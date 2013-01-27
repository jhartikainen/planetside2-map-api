# ps2hq.com map API

This is a simple library to display a PlanetSide 2 Auraxis map with sectors, grid, and other ingame info.

The default tile hosting is on a limited bandwidth. If you use this library on your own site, please consider donating to cover bandwidth costs.

## Install

This library uses NodeJS to build the necessary files. You need to install nodejs and npm in order to build.

Use npm to install required libraries:

    npm install

If you don't have jake, install it using (may require use of `sudo`):

    npm install -g jake

Use jake to build the library

    jake

This produces a bundled script and stylesheet into the dist directory.

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

### Listening to map events

The map emits some events on user interaction.

    //mouse over a sector
    map.on('sector-over', function(sector) {
        //sector has sector info on it.
    });

    //mouse out of sector
    map.on('sector-out', function(sector) {
        //sector has sector info on it.
    });

    //sector click event
    map.on('sector-click', function(sector) {
        //sector has sector info on it.
    });
