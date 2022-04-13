import { SystemError, ISystemErrorInput } from 'lib/utilities/errors';

export class SpaceAccessDeniedError extends SystemError {

  constructor () {
    super({
      severity: 'warning',
      errorType: 'Access denied',
      message: 'You do not have access to this space. Try again with a different user or API token'
    });
  }
}

export class UnknownError extends SystemError {
  constructor (error: any = {}) {
    super({
      errorType: 'Unknown',
      message: 'Something went wrong!',
      error,
      severity: 'error'
    });
  }
}

export class ApiError extends SystemError {

  constructor (errorInfo: Pick<ISystemErrorInput, 'errorType' | 'message'>) {
    super({
      errorType: errorInfo.errorType,
      message: errorInfo.message
    });

    this.severity = this.code >= 500 ? 'error' : 'warning';
  }
}
