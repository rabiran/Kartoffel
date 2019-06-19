export class ApplicationError {
  message: string;
  code: number;
  name: string;
  stack: string;

  constructor(message?: string, code?: number, name?: string, stack?: string) {
    this.message = message || '';
    this.name = name || 'ApplicationError';
    this.code = code || 500;
    this.stack = stack;
  }

  get status() {
    return this.code;
  }

  get statusCode() {
    return this.code;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message?: string, stack?: string) {
    super(message, 400, 'ValidationError', stack);
  }
}
