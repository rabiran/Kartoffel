import { config }  from '../config/config';
const errorsCfg = config.errors;

export class ApplicationError extends Error {
  status: number;
  code: number;
  name: string;

  constructor(message?: string, status?: number, code?: number) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    const errorType = status === 400 ? 'ValidationError' : status === 404 ? 'ResourceNotFoundError' : 'Error';
    this.name = `${errorType}.${this.constructor.name}`;
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
  static ERROR_MESSAGE = 'Unauthorized';
  constructor(message?: string) {
    const code = 1;
    super(message || UnauthorizedError.ERROR_MESSAGE, 401, code);
  }
}

export namespace ValidationError {

  /**
  * @param fields  example: id, name
  * 
  * Error example: missing required fields: 4365436, haha
  */
  export class MissingFields extends ApplicationError {
    constructor(...fields: any) {
      const code = 101;
      const message = `Missing required fields: ${fields}`;
      super(message, 400, code);
    }
  }

  /**
  * @param fields  example: id
  * 
  * Error example: unexpected fields: 665465
  */
  export class UnexpectedFields extends ApplicationError {
    constructor(...fields: any) {
      const code = 102;
      const message = `Unexpected fields: ${fields}`;
      super(message, 400, code);
    }
  }

  /**
  * @param fields  example: id
  * 
  * Error example: invalid fields: 5247457657
  */
  export class InvalidFields extends ApplicationError {
    constructor(...fields: any) {
      const code = 103;
      const message = `Invalid fields: ${fields}`;
      super(message, 400, code);
    }
  }

  /**
  * @param field  example: 'parentId'
  * @param correctType  example: 'string'
  * 
  * Error example: The parentId needs to be of type: string
  */
  export class TypeError extends ApplicationError {
    constructor(field: string, correctType: string) {
      const code = 104;
      const message = `The ${field} needs to be of type: ${correctType}`;
      super(message, 400, code);
    }
  }

  /**
  * @param fields  example: groupName, hierarchy 
  * 
  * Error example: The resource already exists with: goodGroup, unit/nice/group2
  */
  export class ResourceExists extends ApplicationError {
    constructor(...fields: any) {
      const code = 105;
      const message = `The resource already exists with: ${fields}`;
      super(message, 400, code);
    }
  }

  /**
  * @param field  example: 'members'
  * 
  * Error example: Cannot delete the resource with: members!
  */
  export class DeleteError extends ApplicationError {
    constructor(field: string) {
      const code = 106;
      const message = `Cannot delete the resource with: ${field}!`;
      super(message, 400, code);
    }
  }

  /**
  * @param maxDepth  example: '10'
  * 
  * Error example: maxDepth must be positive integer in range: 1 - 10
  */
  export class MaxDepth extends ApplicationError {
    constructor(maxDepth: string) {
      const code = 107;
      const message = `maxDepth must be positive integer in range: 1 - ${maxDepth}`;
      super(message, 400, code);
    }
  }

  /**
  * @param domainUser  example: 'haha@haha.com'
  * 
  * Error example: haha@haha.com is illegal user representation
  */
  export class IllegalUser extends ApplicationError {
    constructor(domainUser: string) {
      const code = 108;
      const message = `${domainUser} is illegal user representation`;
      super(message, 400, code);
    }
  }

  /**
  * @param message  example: 'The personal number and identity card with the same value'
  * 
  * Or get ready error messages exported from error.ts as errors.
  * 
  * Error example: The personal number and identity card with the same value'
  */
  export class CustomError extends ApplicationError {
    constructor(text: string) {
      const customCode = Object.values(errors).indexOf(text);
      const code = 150 + customCode;
      const message = text;
      super(message, 400, code);
    }
  }
}



export namespace ResourceNotFoundError {

  /**
  * @param route  example: '/api/haha'
  * 
  * Error example: Cannot find route /api/haha
  */
  export class Route extends ApplicationError {
    constructor(route: string) {
      const code = 10;
      const message = `Cannot find route ${route}`;
      super(message, 404, code);
    }
  }

  /**
  * @param fields  example: groupName, hierarchy
  * 
  * Error example: Resource not found by goodGroup, unit/nice/group2
  */
  export class ByFields extends ApplicationError {
    constructor(...fields: any) {
      const code = 11;
      const message = `Resource not found by ${fields}`;
      super(message, 404, code);
    }
  }

  /**
  * @param domainUser  example: 'haha@amazing.com'* 
  * 
  * Error example: Person with haha@amazing.com domainUser does not exist
  */
  export class PersonByDomainUser extends ApplicationError {
    constructor(domainUser: string) {
      const code = 12;
      const message = `Person with domainUser ${domainUser} does not exist`;
      super(message, 404, code);
    }
  }

  /**
  * @param message  example: 'The personal number and identity card with the same value''
  * 
  * Or get ready error messages exported from error.ts as errors.
  * 
  * Error example: The personal number and identity card with the same value'
  */
  export class CustomError extends ApplicationError {
    constructor(text: string) {
      const customCode = Object.values(errors).indexOf(text);
      const code = 50 + customCode;
      const message = text;
      super(message, 404, code);
    }
  }
}

export const errors = {
  error_getting_people: 'An unexpected error occurred while fetching people',
  cant_change_domain: 'Cant change domain of user',
  personalNumber_equals_identityCard: 'The personal number and identity card with the same value',
  personalNumber_or_identityCard_exists: 'The personal number or identity card exists',
  person_not_member_of_group: 'This person is not a member in this group, hence can not be appointed as a manager',
  domainUser_doesnt_belong_toPerson: 'The domain user doesnt belong to the person',
  entityType_requires_more_domainUsers: 'persons entityType requires at least 1 domainuser',
  duplicate_key: 'duplicate key error',
  inserting_group_in_itSelf: 'The parentId includes in childrenIDs, Cannot insert organizationGroup itself',
};

