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

  // Get some basic style parameters
  let lineHeight = evalStyle(layout["text-line-height"], zoom) || 1.2;
  let textPadding = evalStyle(layout["text-padding"], zoom) || 2.0;
  let textOffset = evalStyle(layout["text-offset"], zoom) || [0, 0];

  // Variables to store label info between measure and draw calls
  var posShift = [0, 0];
  var labelText, labelLength, labelHeight, x, y;

  // Set text-anchor
  var anchor = evalStyle(layout["text-anchor"], zoom);
  setAnchor(anchor);

  // Setup the text transform function
  var transformCode = evalStyle(layout["text-transform"], zoom);
  var transform = constructTextTransform(transformCode);

  // Set text color and halo properties
  var paint = style.paint;
  ctx.fillStyle   = evalStyle(paint["text-color"], zoom);
  ctx.strokeStyle = evalStyle(paint["text-halo-color"], zoom);
  var haloWidth   = evalStyle(paint["text-halo-width"], zoom) || 0;
  if (haloWidth > 0) {
    ctx.lineWidth = haloWidth * 2.0;
    ctx.lineJoin = "round";
  }

  return {
    measure,
    draw,
  };

  function measure(feature) {
    labelText = feature.properties[field];
    if (!labelText) return;

    labelText = transform(labelText);
    labelLength = ctx.measureText(labelText).width;
    labelHeight = fontSize * lineHeight;

    var coords = feature.geometry.coordinates;
    // Compute coordinates of bottom left corner of text
    x = coords[0] + textOffset[0] * fontSize + posShift[0] * labelLength;
    y = coords[1] + textOffset[1] * labelHeight + posShift[1] * labelHeight;

    // Return a bounding box object
    return [
      [x - textPadding, y - labelHeight - textPadding],
      [x + labelLength + textPadding, y + textPadding]
    ];
  }

  function draw() {
    if (!labelText) return;

    if (haloWidth > 0) ctx.strokeText(labelText, x, y);
    ctx.fillText(labelText, x, y);
  }

  function setAnchor(anchor) {
    // Set baseline
    ctx.textBaseline = "bottom";
    switch (anchor) {
      case "top-left":
      case "top-right":
      case "top":
        //ctx.textBaseline = "top";
        posShift[1] = 1.0;
        break;
      case "bottom-left":
      case "bottom-right":
      case "bottom":
        posShift[1] = 0.0;
        //ctx.textBaseline = "bottom";
        break;
      case "left":
      case "right":
      case "center":
      default:
        //ctx.textBaseline = "middle";
        posShift[1] = 0.5;
    }
    // Set textAlign
    ctx.textAlign = "left";
    switch (anchor) {
      case "top-left":
      case "bottom-left":
      case "left":
        //ctx.textAlign = "left";
        posShift[0] = 0.0;
        break;
      case "top-right":
      case "bottom-right":
      case "right":
        //ctx.textAlign = "right";
        posShift[0] = -1.0;
        break;
      case "top":
      case "bottom":
      case "center":
      default:
        //ctx.textAlign = "center";
        posShift[0] = -0.5;
    }
    return;
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
