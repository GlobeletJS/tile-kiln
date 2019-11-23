export function initGroups(styleDoc) {
  // Filter to confirm an array element is not equal to the previous element
  const uniq = (x, i, a) => ( !i || x !== a[i-1] );

  const groupNames = styleDoc.layers
    .map( layer => layer["tilekiln-group"] || "none" )
    .filter(uniq);

  // Make sure the groups are in order, not interleaved
  const groupCheck = groupNames.slice().sort().filter(uniq);
  if (groupCheck.length !== groupNames.length) {
    // TODO: assumes we are calling from a Promise chain?
    throw Error("tile-kiln setup: Input layer groups are not in order!");
  }

  // For each group name, collect the layers from the style document, and
  // add a visibility property
  const groups = groupNames.map( name => {
    return {
      name,
      visible: true,
      layers: sortStyleGroup(styleDoc.layers, name),
    };
  });

  return groups;
}

function sortStyleGroup(layers, groupName) {
  // Get the layers belonging to this group
  var group = (groupName !== "none")
    ? layers.filter(layer => layer["tilekiln-group"] === groupName)
    : layers.filter(layer => !layer["tilekiln-group"]);

  // Reverse the order of the symbol layers
  var labels = group.filter(layer => layer.type === "symbol").reverse();

  // Append reordered symbol layers to non-symbol layers
  return group.filter(layer => layer.type !== "symbol").concat(labels);
}
