module.exports = function(doc) {
  var lastName;

  if (doc.lastName)
    lastName = ' '+doc.lastName;
  else
    lastName = '';

  doc.fullName = doc.firstName + lastName;
  
  var hierarchyPath = doc.hierarchy.join('/');
  doc.hierarchyPath = hierarchyPath;

  return doc;
}