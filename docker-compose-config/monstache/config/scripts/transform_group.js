module.exports = function(doc) {
  var hierarchyPath = doc.hierarchy.join('/');
  doc.hierarchyPath = hierarchyPath;
  return doc;
}