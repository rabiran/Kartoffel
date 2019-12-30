module.exports = function(doc) {
  doc.id = doc._id;
  return _.omit(doc, '__v');
}