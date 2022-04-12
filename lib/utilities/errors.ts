
// Subset of error types from @mui/material/Alert
export type ErrorSeverity = 'warning' | 'error';

const ErrorCodes = {
  Unknown: 0,
  'Invalid input': 1,
  'Data not found': 2,
  'Access denied': 3,
  'External service': 4
};

type ErrorType = keyof typeof ErrorCodes

/**
 * @error used for providing structured JSON or a stack trace
 */
export interface ISystemError {
  code: number,
  errorType: ErrorType
  message: string,
  errorConstructor: string
  severity: ErrorSeverity
  error: any
}

export class SystemError implements ISystemError {

  code: number;

  errorType: ErrorType;

  message: string;

  errorConstructor: string;

  severity: ErrorSeverity;

  error: any;

  constructor (errorInfo: Pick<ISystemError, 'message' | 'errorType'> & Partial<Pick<ISystemError, 'severity' | 'error'>>) {
    this.errorType = errorInfo.errorType;
    this.code = ErrorCodes[this.errorType];
    this.message = errorInfo.message;
    this.errorConstructor = this.constructor.name;
    this.severity = errorInfo.severity ?? 'error';
    this.error = errorInfo.error ?? {};
  }

}

// Keep empty for now until we decide how to do error handling in future
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IApiError extends ISystemError {}

export interface IUserError extends ISystemError {
  severity: ErrorSeverity
}
