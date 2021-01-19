type Query<T = any> = {
  [k in keyof T]: string | string[];
};
export default Query;
