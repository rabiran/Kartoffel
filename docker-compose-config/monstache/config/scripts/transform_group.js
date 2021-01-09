module.exports = function(doc) {
  return _.omit(doc, 'children', 'ancestors');
}