import { initTextLabeler } from "./text.js";
import { initIconLabeler } from "./icons.js";

export function initLabeler(ctx, sprite) {
  var boxes = [];

  return {
    clearBoxes,
    draw,
  };

  function clearBoxes() {
    boxes = [];
  }

  function draw(style, zoom, data) {
    var layout = style.layout;
    if (layout["symbol-placement"] === "line") return;

    const textLabeler = initTextLabeler(ctx, style, zoom);
    const iconLabeler = initIconLabeler(ctx, style, zoom, sprite);

    // Now render all the specified labels
    data.features.forEach(drawLabel);

    function drawLabel(feature) {
      // TODO: check for collisions...

      // Draw the labels
      iconLabeler.draw(feature);
      textLabeler.draw(feature);
      return;
    }
  }
}
