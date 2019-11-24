export function loadImage(href, callback) {
  const errMsg = "ERROR in loadImage for href " + href;
  const img = new Image();

  img.onerror = () => callback(errMsg);

  img.onload = () => (img.complete && img.naturalWidth !== 0)
    ? callback(null, img)
    : callback(errMsg);

  img.crossOrigin = "anonymous";
  img.src = href;

  return img;
}
