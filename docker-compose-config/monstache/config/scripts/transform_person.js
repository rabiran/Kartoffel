module.exports = function(doc) {
  var result;

  if (doc.lastName)
    result = ' '+doc.lastName;
  else
    result = '';

  doc.fullName = doc.firstName + result;
  return doc;
}