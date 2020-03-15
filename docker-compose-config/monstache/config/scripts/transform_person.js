module.exports = function(doc) {
  var lastName;

  if (doc.lastName)
    lastName = ' '+doc.lastName;
  else
    lastName = '';

  doc.fullName = doc.firstName + lastName;
  return doc;
}