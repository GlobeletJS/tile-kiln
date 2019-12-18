export function initMapControl(coords, update) {
  document.getElementById("left")
    .addEventListener("click", () => (coords.x--, update()), false);

  document.getElementById("right")
    .addEventListener("click", () => (coords.x++, update()), false);

  document.getElementById("up")
    .addEventListener("click", () => (coords.y++, update()), false);

  document.getElementById("down")
    .addEventListener("click", () => (coords.y--, update()), false);

  document.getElementById("zoomIn")
    .addEventListener("click", () => {
      coords.z++;
      coords.y *= 2;
      coords.x *= 2;
      update();
    }, false);

  document.getElementById("zoomOut")
    .addEventListener("click", () => {
      coords.z--;
      coords.x = Math.floor(coords.x / 2);
      coords.y = Math.floor(coords.y / 2);
      update();
    }, false);
}
