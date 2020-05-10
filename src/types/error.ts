import { config }  from '../config/config';
const errorsCfg = config.errors;

export class ApplicationError extends Error {
  status: number;
  code: number;
  name: string;

  constructor(message?: string, status?: number, code?: number) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.status = status || 500;
    this.code = code || 0;
  }

  // get status() {
  //   return this.code;
  // }

  // get statusCode() {
  //   return this.code;
  // }
}



export class UnauthorizedError extends ApplicationError {
  constructor(code?: number, params?: string[]) {
    const message = createError(401, code, params);
    super(message, 401, code);
  }
}

export class ValidationError extends ApplicationError {

  // public missingFields = new class extends ApplicationError {
  //   constructor(...params: any) {
  //     const message = `missing required fields: ${params}`;
  //     super(message, 400, 101);
  //   }
  // }
  constructor(code?: number, params?: string[]) {
    const message = createError(400, code, params);
    super(message, 400, code);
  }
}

export class ResourceNotFoundError extends ApplicationError {
  constructor(code?: number, params?: string[]) {
    const message = createError(404, code, params);
    super(message, 404, code);
  }
}





export namespace Validation {
  export class MissingFields extends ApplicationError {
    constructor(...params: any) {
      const code = 101;
      const message = `Error ${code}: missing required fields: ${params}`;
      super(message, 400, code);
    }
  }

  export class UnexpectedFields extends ApplicationError {
    constructor(...params: any) {
      const code = 102;
      const message = `Error ${code}: unexpected fields: ${params}`;
      super(message, 400, code);
    }
  }

  export class InvalidFields extends ApplicationError {
    constructor(...params: any) {
      const code = 103;
      const message = `Error ${code}: invalid fields: ${params}`;
      super(message, 400, code);
    }
  }

  export class TypeError extends ApplicationError {
    constructor(field: string, correctType: string) {
      const code = 104;
      const message = `Error ${code}: The ${field} needs to be of type: ${correctType}`;
      super(message, 400, code);
    }
  }

  export class ResourceExists extends ApplicationError {
    constructor(...fields: any) {
      const code = 105;
      const message = `Error ${code}: The resource already exists with: ${fields}`;
      super(message, 400, code);
    }
  }

  export class DeleteError extends ApplicationError {
    constructor(field: string) {
      const code = 106;
      const message = `Error ${code}: cannot delete the resource with: ${field}!`;
      super(message, 400, code);
    }
  }
}

export namespace ResourceNotFound {
  export class _ extends ApplicationError {
    constructor(field: string) {
      const code = 10;
      const message = `Error ${code}: cannot find resource ${field}`;
      super(message, 400, code);
    }
  }
}





function createError(httpError: number, errorCode: number, params?: string[]) {
  const errorObj = errorsCfg.find((element)=> element.code === httpError);
  const error = errorObj.errors.find((element)=> element.code === errorCode);
  if(!error) 
    return errorObj.name;
  let message = `Error ${error.code}: ${error.message}`;
  if(params) {
    for(let param of params) {
      message.replace('{param}', param);
    }
  }
  return message;
}

// function insertParams(params: string[], message: string) {
//   for(let param of params) {
//     message.replace('{param}', param);
//   }
// }

// export class KartoffelError extends ApplicationError {
//   constructor(code: number, message?: string) {
//     const error = config.errors.find((element)=> element.code === code);
//     const errorMessage = message || error.message;
//     super(errorMessage, code);
//   }
// }

// let errors;

// for(let error of config.errors) {
//   let a = this;
//   const name = error.error;
//   let errorClass = class this['name'] extends ApplicationError {
//     constructor(message?: string) {
//       super(message || error.message, error.code);
//     }
//   }
// }

// export {
//   errors
// }
