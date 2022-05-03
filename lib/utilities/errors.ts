
// Subset of error types from @mui/material/Alert
export type ErrorSeverity = 'warning' | 'error';

const ErrorCodes = {
  Unknown: 500,
  'Invalid input': 400,
  'Undesirable operation': 400,
  'Data not found': 404,
  'Access denied': 401,
  'External service': 500,
  'Unexpected result': 500
};

type ErrorType = keyof typeof ErrorCodes

/**
 * @error used for providing structured JSON or a stack trace
 */
export interface ISystemError<E = any> {
  code: number,
  errorType: ErrorType
  message: string,
  errorConstructor: string
  severity: ErrorSeverity
  error: E
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
