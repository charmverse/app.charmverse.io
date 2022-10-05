
// Subset of error types from @mui/material/Alert
export type ErrorSeverity = 'warning' | 'error';

const ErrorCodes = {
  Unknown: 500,
  'Invalid input': 400,
  'Unable to respond': 421,
  'Undesirable operation': 400,
  'Duplicate data': 400,
  'Data not found': 404,
  'Maximum size exceeded': 400,
  'Access denied': 401,
  'Insecure operation': 401,
  'External service': 500,
  'Unexpected result': 500
};

type ErrorType = keyof typeof ErrorCodes

/**
 * @error used for providing structured JSON or a stack trace
 */
export interface ISystemError<E = any> {
  code: number;
  errorType: ErrorType;
  message: string;
  errorConstructor: string;
  severity: ErrorSeverity;
  error: E;
}

export type ISystemErrorInput<E = any> = Pick<ISystemError<E>, 'message' | 'errorType'> & Partial<Pick<ISystemError<E>, 'severity' | 'error'>>

export class SystemError<E = any> implements ISystemError<E> {

  code: number;

  errorType: ErrorType;

  message: string;

  errorConstructor: string;

  severity: ErrorSeverity;

  error: E;

  constructor (errorInfo: ISystemErrorInput<E>) {
    this.errorType = errorInfo.errorType;
    this.code = ErrorCodes[this.errorType];
    this.message = errorInfo.message;
    this.errorConstructor = this.constructor.name;
    this.severity = errorInfo.severity ?? 'error';
    this.error = errorInfo.error ?? {} as any;
  }

}

// Common Errors
export class InvalidInputError extends SystemError {

  constructor (message: string) {
    super({
      message,
      errorType: 'Invalid input',
      severity: 'warning'
    });
  }
}

export class DataNotFoundError extends SystemError {
  constructor (message: string = 'Data not found') {
    super({
      message,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}

export class ExternalServiceError extends SystemError {
  constructor (message: string = 'Something went wrong with an external service.') {
    super({
      message,
      errorType: 'External service',
      severity: 'error'
    });
  }
}

export class UnknownError extends SystemError {
  constructor (err?: any) {
    super({
      message: 'Something went wrong.',
      errorType: 'Unknown',
      severity: 'error',
      error: err
    });
  }
}

export class UnauthorisedActionError extends SystemError {
  constructor (message = 'You do not have access to perform this action.') {
    super({
      message,
      errorType: 'Access denied',
      severity: 'error'
    });
  }
}

export class InsecureOperationError extends SystemError {
  constructor (message = 'Insecure operation cannot be performed.') {
    super({
      message,
      errorType: 'Access denied',
      severity: 'error'
    });
  }
}

export class UndesirableOperationError extends SystemError {
  constructor (message = 'This operation should not be performed.') {
    super({
      message,
      errorType: 'Undesirable operation',
      severity: 'warning'
    });
  }
}

export class MissingWeb3AccountError extends SystemError {
  constructor () {
    super({
      message: 'No connected wallet detected. This is required to proceed.',
      errorType: 'Invalid input',
      severity: 'warning'
    });
  }
}

export class MissingWeb3SignatureError extends SystemError {
  constructor () {
    super({
      message: 'This operation requires a signature from your connected wallet.',
      errorType: 'Insecure operation',
      severity: 'warning'
    });
  }
}
