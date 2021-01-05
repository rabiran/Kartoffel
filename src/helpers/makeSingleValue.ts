export default <T>(val: T | T[]): T => {
  if (Array.isArray(val)) {
    return val.length > 0 ? val[0] : undefined;
  }
  return val;
};
