export function initMapControl(coords, update) {
  document.getElementById("left")
    .addEventListener("click", () => move( 0, -1,  0), false);

  document.getElementById("right")
    .addEventListener("click", () => move( 0,  1,  0), false);

  document.getElementById("up")
    .addEventListener("click", () => move( 0,  0, -1), false);

  document.getElementById("down")
    .addEventListener("click", () => move( 0,  0,  1), false);

  document.getElementById("zoomIn")
    .addEventListener("click", () => move( 1,  0,  0), false);

  document.getElementById("zoomOut")
    .addEventListener("click", () => move(-1,  0,  0), false);

  function move(dz, dx, dy) {
    coords.x += dx;
    coords.y += dy;

    if (dz < 0) {         // Zoom out
      coords.z--;
      coords.x = Math.floor(coords.x / 2);
      coords.y = Math.floor(coords.y / 2);

    } else if (dz > 0) {  // Zoom in
      coords.z++;
      coords.x *= 2;
      coords.y *= 2;
    }

    update();
  }
}
