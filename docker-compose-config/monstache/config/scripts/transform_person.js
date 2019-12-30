module.exports = function(doc) { 
  doc.fullName = doc.firstName + ' ' + doc.lastName;
  return doc;
}