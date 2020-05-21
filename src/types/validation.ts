export interface ValidatorFunction {
  (value: any) : boolean;
}

export interface ValidatorObj {
  validator: ValidatorFunction;
  message?: string;
  code?: number;
  fields?: string[];
}
