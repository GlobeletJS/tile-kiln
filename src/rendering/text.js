import { evalStyle } from "./styleFunction.js";
import { getTokenParser } from "./tokens.js";
import { getFontString } from "./font.js";

export function initTextLabeler(ctx, style, zoom) {
  var layout = style.layout;
  var field = evalStyle(layout["text-field"], zoom);

  // TODO: allow tokens in field
  if (!field || typeof field !== "string") return;
  field = field.replace(/[{}]/g, "");

  // Construct the ctx.font string from text-size and text-font
  var fontSize = evalStyle(layout["text-size"], zoom) || 16;
  var fontFace = evalStyle(layout["text-font"], zoom);
  ctx.font = getFontString(fontSize, fontFace);

  //console.log("renderText: layer, field, fontString = " +
  //    style.id + ", " + field + ", " + fontString);

  // Set text-anchor
  var anchor = evalStyle(layout["text-anchor"], zoom);
  setAnchor(ctx, anchor);

  // Get the text-offset
  var offset = evalStyle(layout["text-offset"], zoom) || [0, 0];

  // Setup the text transform function
  var transformCode = evalStyle(layout["text-transform"], zoom);
  var transform = constructTextTransform(transformCode);

  // Set text color and halo properties
  var paint = style.paint;
  ctx.fillStyle   = evalStyle(paint["text-color"], zoom);
  ctx.strokeStyle = evalStyle(paint["text-halo-color"], zoom);
  var haloWidth   = evalStyle(paint["text-halo-width"], zoom) || 0;
  if (haloWidth > 0) ctx.lineWidth = haloWidth * 2.0;

  return {
    //measure,
    draw,
  };

  function draw(feature) { 
    var labelText = feature.properties[field];
    if (!labelText) {
      console.log("drawLabel: No text in " + field + "!");
      console.log(JSON.stringify(feature));
      return;
    }
    labelText = transform(labelText);

    var coords = feature.geometry.coordinates;
    var x = coords[0] + offset[0] * fontSize;
    var y = coords[1] + offset[1] * fontSize;

    if (haloWidth > 0) ctx.strokeText(labelText, x, y);
    ctx.fillText(labelText, x, y);
  }
}

function constructTextTransform(code) {
  switch (code) {
    case "uppercase":
      return f => f.toUpperCase();
    case "lowercase":
      return f => f.toLowerCase();
    case "none":
    default:
      return f => f;
  }
}

function setAnchor(ctx, anchor) {
  switch (anchor) {
    case "top-left":
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      break;
    case "top-right":
      ctx.textBaseline = "top";
      ctx.textAlign = "right";
      break;
    case "top":
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      break;
    case "bottom-left":
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      break;
    case "bottom-right":
      ctx.textBaseline = "bottom";
      ctx.textAlign = "right";
      break;
    case "bottom":
      ctx.textBaseline = "bottom";
      ctx.textAlign = "center";
      break;
    case "left":
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      break;
    case "right":
      ctx.textBaseline = "middle";
      ctx.textAlign = "right";
      break;
    case "center":
    default:
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
  }
  return;
}
