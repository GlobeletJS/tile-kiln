# tilekiln
Inputs map data (both raster and vector) and renders it into tiles.
Styling is guided by a document following the [Mapbox style specification].

[Mapbox style specification]: https://docs.mapbox.com/mapbox-gl-js/style-spec/

## Initialization
tilekiln.init takes a parameter object with the following properties:
- style (REQUIRED): A URL pointing to a Mapbox style document
- token (OPTIONAL): A Mapbox API token. Required if style URL and tile
  endpoints follow the Mapbox shorthand (mapbox://...)
- size (OPTIONAL): The size of the rendered tiles (square). Defaults to 512.
- callback(OPTIONAL): A function which will be executed when the initialization
  is complete. Initialization is asynchronous because of the HTTP calls to
  retrieve the style document, and any TileJSON documents which are referenced
  from within the style document

## API
Initialization returns an object with the following properties:
- style: A link to the style document
- create(z, x, y\[, callback\]): Creates a new tile object at the specified
  z/x/y indices. Immediately returns the object, but requests data and renders
  it asynchronously. Optionally executes callback when complete.
- redraw(tile\[, callback\]): re-renders an existing tile (e.g., after a change
  to the style document). Assumes all the data for the tile has already been 
  loaded and parsed.
- ready: A (Boolean) flag indicating whether the kiln is ready to start making
  tiles (i.e., styles have been loaded and parsed)
