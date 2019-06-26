import { getFeatures } from "./getFeatures.js";
import { initPainter } from "./painter.js";
import { initLabeler } from "./labeler.js";

export function initRenderer(canvSize, styleLayers, styleGroups, sprite) {
  // Input canvSize is an integer, for the pixel size of the (square) tiles
  // Input styleLayers points to the .layers property of a Mapbox style document
  //   Specification: https://docs.mapbox.com/mapbox-gl-js/style-spec/
  // Input styleGroups is a list of style layer groups identified by a
  //   "tilekiln-group" property of each layer
  // Input sprite (if defined) is an object with image and meta properties

  // Create canvas for rendering, set drawingbuffer size
  const canvas = document.createElement("canvas");
  canvas.width = canvSize;
  canvas.height = canvSize;

  // Initialize rendering context and save default styles
  const ctx = canvas.getContext("2d");
  ctx.save();

  // Initialize painter: paints a single layer onto the canvas
  const painter = initPainter(ctx);
  // Initialize labeler: draws text labels and "sprite" icons
  const labeler = initLabeler(ctx, sprite);

  // Sort styles into groups
  const styles = {};
  styleGroups.forEach( group => {
    styles[group] = sortStyleGroup(styleLayers, group);
  });

  var getLamina, composite;
  if (styleGroups.length > 1) { 
    // Define function to return the appropriate lamina (partial rendering)
    getLamina = (tile, group) => tile.laminae[group];
    // Define function to composite all laminae canvases into the main canvas
    composite = (tile) => {
      tile.ctx.clearRect(0, 0, canvSize, canvSize);
      styleGroups.forEach( group => {
        tile.ctx.drawImage(tile.laminae[group].img, 0, 0);
      });
      tile.rendered = true;
    };
  } else {
    // Only one group of style layers. Render directly to the main canvas
    getLamina = (tile, group) => tile;
    // Compositing is not needed: return a dummy no-op function
    composite = (tile) => true;
  }

  return {
    drawGroup,
    composite,
    canvas,
  };

  function drawGroup(tile, group = "none", callback = () => undefined) {
    if (!styles[group]) return callback(null, tile);

    // Clear context and bounding boxes
    ctx.clearRect(0, 0, canvSize, canvSize);
    labeler.clearBoxes();

    // Draw the layers
    styles[group].forEach( style => drawLayer(style, tile.z, tile.sources) );

    // Copy the rendered image to the tile
    let lamina = getLamina(tile, group);
    lamina.ctx.clearRect(0, 0, canvSize, canvSize);
    lamina.ctx.drawImage(canvas, 0, 0);
    
    lamina.rendered = true;
    return callback(null, tile);
  }

  function drawLayer(style, zoom, sources) {
    // Quick exits if this layer is not meant to be displayed
    if (style.layout && style.layout["visibility"] === "none") return;
    if (style.minzoom !== undefined && zoom < style.minzoom) return;
    if (style.maxzoom !== undefined && zoom > style.maxzoom) return;

    // Start from default canvas state: restore what we saved
    ctx.restore();
    // restore POPS the saved state off a stack. So if we want to restore again
    // later, we need to re-save what we just restored
    ctx.save();

    if (style.type === "background") return painter.fillBackground(style, zoom);

    var source = sources[ style["source"] ];
    if (style.type === "raster") return painter.drawRaster(style, zoom, source);

    var mapLayer = source[ style["source-layer"] ];
    var mapData = getFeatures(mapLayer, style.filter);
    if (!mapData) return;

    switch (style.type) {
      case "circle":  // Point or MultiPoint geometry
        return painter.drawCircles(style, zoom, mapData);
      case "line":    // LineString, MultiLineString, Polygon, or MultiPolygon
        return painter.drawLines(style, zoom, mapData);
      case "fill":    // Polygon or MultiPolygon (maybe also linestrings?)
        return painter.drawFills(style, zoom, mapData);
      case "symbol":  // Labels
        return labeler.draw(style, zoom, mapData);
      default:
        // Missing fill-extrusion, heatmap, hillshade
        console.log("ERROR in drawLayer: layer.type = " + style.type +
            " not supported!");
    }
    return;
  }
}

function sortStyleGroup(layers, groupName) {
  // Get the layers belonging to this group
  var group = (groupName === "none")
    ? layers.filter(layer => !layer["tilekiln-group"]) // Layers with no group specified
    : layers.filter(layer => layer["tilekiln-group"] === groupName);

  // Reverse the order of the symbol layers
  var labels = group.filter(layer => layer.type === "symbol").reverse();

  // Append reordered symbol layers to non-symbol layers
  return group.filter(layer => layer.type !== "symbol").concat(labels);
}
