// Subset of error types from @mui/material/Alert
export type ErrorSeverity = 'warning' | 'error';

export const ErrorCodes = {
  'Duplicate data': 400,
  'Invalid input': 400,
  'Undesirable operation': 400,
  'Maximum size exceeded': 400,
  'Subscription required': 402,
  'Disabled account': 409,
  'Access denied': 401,
  'Insecure operation': 401,
  'Data not found': 404,
  Conflict: 409,
  'Unable to respond': 421,
  'External service': 500,
  Unknown: 500,
  'Unexpected result': 500
};

export type ErrorType = keyof typeof ErrorCodes;

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

export type ISystemErrorInput<E = any> = Pick<ISystemError<E>, 'message' | 'errorType'> &
  Partial<Pick<ISystemError<E>, 'severity' | 'error'>>;

export class SystemError<E = any> extends Error implements ISystemError<E> {
  code: number;

  errorType: ErrorType;

  message: string;

  errorConstructor: string;

  severity: ErrorSeverity;

  error: E;

  constructor(errorInfo: ISystemErrorInput<E>) {
    super(errorInfo.message);
    this.errorType = errorInfo.errorType;
    this.code = ErrorCodes[this.errorType];
    this.message = errorInfo.message;
    this.errorConstructor = this.constructor.name;
    this.severity = errorInfo.severity ?? 'error';
    this.error = errorInfo.error ?? ({} as any);
  }
}

// Common Errors
export class InvalidInputError extends SystemError {
  constructor(message: string) {
    super({
      message,
      errorType: 'Invalid input',
      severity: 'warning'
    });
  }
}

export class DataNotFoundError extends SystemError {
  constructor(message: string = 'Data not found') {
    super({
      message,
      errorType: 'Data not found',
      severity: 'warning'
    });
  }
}

export class ExternalServiceError extends SystemError {
  constructor(message: string = 'Something went wrong with an external service.') {
    super({
      message,
      errorType: 'External service',
      severity: 'error'
    });
  }
}

export class UnknownError extends SystemError {
  constructor(err?: any) {
    super({
      message: 'Something went wrong.',
      errorType: 'Unknown',
      severity: 'error',
      error: err
    });
  }
}

export class UnauthorisedActionError extends SystemError {
  constructor(message = 'You do not have access to perform this action.') {
    super({
      message,
      errorType: 'Access denied',
      severity: 'error'
    });
  }
}

export class InsecureOperationError extends SystemError {
  constructor(message = 'Insecure operation cannot be performed.') {
    super({
      message,
      errorType: 'Access denied',
      severity: 'error'
    });
  }
}

export class UndesirableOperationError extends SystemError {
  constructor(message = 'This operation should not be performed.') {
    super({
      message,
      errorType: 'Undesirable operation',
      severity: 'warning'
    });
  }
}

export class MissingWeb3AccountError extends SystemError {
  constructor() {
    super({
      message: 'No connected wallet detected. This is required to proceed.',
      errorType: 'Invalid input',
      severity: 'warning'
    });
  }
}

export class MissingWeb3SignatureError extends SystemError {
  constructor() {
    super({
      message: 'This operation requires a signature from your connected wallet.',
      errorType: 'Insecure operation',
      severity: 'warning'
    });
  }
}

export class DataConflictError extends SystemError {
  constructor(message = 'Data conflict') {
    super({
      message,
      errorType: 'Conflict',
      severity: 'warning'
    });
  }
}

export class BrowserPopupError extends SystemError {
  constructor(message = 'Popup could not be opened') {
    super({
      message,
      errorType: 'Unknown',
      severity: 'warning'
    });
  }
}
export class DisabledAccountError extends SystemError {
  constructor(message = 'This account is disabled.') {
    super({
      message,
      errorType: 'Disabled account',
      severity: 'warning'
    });
  }
}

/**
 * Used in tests when we should be receiving an error
 */
export class ExpectedAnError extends SystemError {
  constructor() {
    super({
      errorType: 'Unexpected result',
      message: 'Expected an error to be thrown',
      severity: 'error'
    });
  }
}

export class SubscriptionRequiredError extends SystemError {
  constructor() {
    super({
      errorType: 'Subscription required',
      message: 'A paid subscription is required for your space to access this feature',
      severity: 'warning'
    });
  }
}
