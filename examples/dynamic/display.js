export function initDisplay(divID) {
  // Input is the ID of an HTML <div> where everything will be displayed

  // Get the div itself
  var displayDiv = document.getElementById(divID);

  // Add the main canvas, which fills the whole display div
  var canvas = addChild( displayDiv, 'canvas', 'display-canvas');
  // Initialize the main rendering context
  var context = canvas.getContext("2d");

  // Set size of drawingbuffer
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  return context;
}

function addChild(parentElement, childType, cssClass) {
  var child = document.createElement(childType);
  child.classList.add(cssClass);
  parentElement.appendChild(child);
  return child;
}
