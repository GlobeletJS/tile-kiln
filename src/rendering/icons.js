import { evalStyle } from "./styleFunction.js";
import { getTokenParser } from "./tokens.js";

export function initIconLabeler(ctx, style, zoom, sprite) {
  var layout = style.layout;
  var spriteID, spriteMeta, x, y;

  // Get sprite metadata
  var spriteName = evalStyle(layout["icon-image"], zoom);
  var iconParser = getTokenParser(spriteName);

  var iconPadding = evalStyle(layout["icon-padding"], zoom) || 2;

  return {
    measure,
    draw,
  };

  function measure(feature) {
    spriteID = iconParser(feature.properties);
    if (!spriteID) return;

    spriteMeta = sprite.meta[spriteID];

    var coords = feature.geometry.coordinates;
    x = Math.round(coords[0] - spriteMeta.width / 2);
    y = Math.round(coords[1] - spriteMeta.height / 2);

    return [
      [x - iconPadding, y - iconPadding],
      [x + spriteMeta.width + iconPadding, y + spriteMeta.height + iconPadding]
    ];
  } 

  function draw() {
    if (!spriteID) return;

    ctx.drawImage(
        sprite.image,
        spriteMeta.x,
        spriteMeta.y,
        spriteMeta.width,
        spriteMeta.height,
        x,
        y,
        spriteMeta.width,
        spriteMeta.height
        );
  }
}
