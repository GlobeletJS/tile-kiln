# tile-kiln

Map tile rendering guided by a Mapbox style document

Inputs map data (both raster and vector) and renders it into tiles.
Styling is guided by a document following the [Mapbox style specification].

Please note: many features in Mapbox's specification are not implemented.
tile-kiln is intended to be an 80/20 solution for vector tile rendering:
implementing ~80% of the style specification with 20% of the code.

Note also: to make the code simpler, rendering is done with [Canvas 2D]
methods, rather than trying to re-implement basic things (like drawing lines)
in WebGL. This necessarily means that tile-kiln will be slower than WebGL
renderers. If you just need a fast, full-featured vector map, try 
[Mapbox GL JS].

Check out the simple [single-tile example] with dynamic style changes.
Like the simple code, but need one more feature? We welcome pull requests!

[Mapbox style specification]: https://docs.mapbox.com/mapbox-gl-js/style-spec/
[Canvas2D]: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
[Mapbox GL JS]: https://github.com/mapbox/mapbox-gl-js
[single-tile example]: https://globeletjs.github.io/tile-kiln/examples/dynamic/index.html

## Layer Groups
tile-kiln implements layer groups as an extension to the style specification.
These enable pre-rendering of groups of layers. The styles or data for a group
can be modified, and the re-rendered group can then be re-composited with the
other groups, *without needing to re-render the other groups*.

To define layer groups, simply add the following property to the style of
EVERY layer:
```javascript
"tilekiln-group": "<group-name>",
```
Note that the style layers for any group MUST be listed in order, not
interleaved.

To re-render one layer group, first modify the styles for the group as needed.
Then set
```javascript
tile.laminae[groupName].rendered = false;
tile.rendered = false;
```
and call tileKiln.redraw(tile). Layer groups with
```javascript
tile.laminae[group].rendered === true && tile.laminae[group].visible === true
```
will simply be re-composited into the final image, without change.

## Initialization
tileKiln.init takes a parameter object with the following properties:
- style (REQUIRED): A URL pointing to a Mapbox style document.
- token (OPTIONAL): A Mapbox API token. Required if style URL and tile
  endpoints follow the Mapbox shorthand (mapbox://...).
- size (OPTIONAL): The size in pixels of the rendered tiles (always square). 
  Defaults to 512.
- callback (OPTIONAL): A function which will be executed when the initialization
  is complete.

Initialization is asynchronous because of the HTTP calls to retrieve the style
document, and any TileJSON documents referenced from within the style.

## API
Initialization returns an object with the following properties:
- `style`: A link to the style document.
- `groups`: An array of the group names found in the supplied style document.
- `create(z, x, y\[, callback\])`: Creates a new tile object at the specified
  z/x/y indices. Immediately returns the object, but requests data and renders
  it asynchronously. Optionally executes callback when complete.
- `hideGroup(name)`: Sets visibility = false for the supplied layer group name.
- `showGroup(name)`: Sets visibility = true for the supplied layer group name.
- `redraw(tile\[, callback\])`: re-renders an existing tile (e.g., after a change
  to the style document). Assumes all the data for the tile has already been 
  loaded and parsed. For layer groups: only re-renders the layers within the
  group IF group.rendered = false AND group.visible = true.
- `activeDrawCalls()`: Returns the number of tiles in the rendering queue.
- `sortTasks(ranking)`: Re-orders the rendering tasks in the queue, based on the
  value of ranking(tile.id). Tasks with a smaller ranking value will be 
  rendered first (starting from rank 1).
- `ready`: A (Boolean) flag indicating whether the kiln is ready to start making
  tiles (i.e., styles have been loaded and parsed).
