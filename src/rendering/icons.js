import { evalStyle } from "./styleFunction.js";
import { getTokenParser } from "./tokens.js";

export function initIconLabeler(ctx, style, zoom, sprite) {
  var layout = style.layout;

  // Get sprite metadata
  var spriteName = evalStyle(layout["icon-image"], zoom);
  var iconParser;
  if (spriteName) {
    console.log("renderText: layer, icon-image: " + 
        style.id + ", " + spriteName);
    iconParser = getTokenParser(spriteName);
  }

  return {
    //measure,
    draw,
  };

  function draw(feature) {
    if (!spriteName) return;
    var coords = feature.geometry.coordinates;

    var spriteID = iconParser(feature.properties);
    var spriteMeta = sprite.meta[spriteID];
    ctx.drawImage(
        sprite.image,
        spriteMeta.x,
        spriteMeta.y,
        spriteMeta.width,
        spriteMeta.height,
        coords[0] - spriteMeta.width / 2,
        coords[1] - spriteMeta.height / 2,
        spriteMeta.width,
        spriteMeta.height
        );
  }
}
