import type { ISystemErrorInput } from '@packages/utils/errors';
import { SystemError } from '@packages/utils/errors';

export class SpaceAccessDeniedError extends SystemError {
  constructor() {
    super({
      severity: 'warning',
      errorType: 'Access denied',
      message: 'You do not have access to this space. Try again with a different user or API token'
    });
  }
}

export class NotFoundError extends SystemError {
  constructor(message = 'Data not found') {
    super({
      severity: 'warning',
      errorType: 'Data not found',
      message
    });
  }
}

export class ActionNotPermittedError extends SystemError {
  constructor(message?: string) {
    super({
      severity: 'warning',
      errorType: 'Access denied',
      message: message ?? 'You are not allowed to perform this action.'
    });
  }
}

export class UnknownError extends SystemError {
  constructor(error: any = {}) {
    super({
      errorType: 'Unknown',
      message: 'Something went wrong!',
      error,
      severity: 'error'
    });
  }
}

export class InvalidStateError extends SystemError {
  constructor(message: string = 'Something went wrong') {
    super({
      message,
      errorType: 'Invalid input',
      severity: 'error'
    });
  }
}

export class ApiError extends SystemError {
  constructor(errorInfo: Pick<ISystemErrorInput, 'errorType' | 'message'>) {
    super({
      errorType: errorInfo.errorType,
      message: errorInfo.message
    });

    this.severity = this.code >= 500 ? 'error' : 'warning';
  }
}
export class InvalidApiKeyError extends SystemError {
  constructor() {
    super({
      message:
        'Invalid API key. Please visit https://app.charmverse.io/api-docs to learn more about how to authenticate with our API.',
      errorType: 'Access denied'
    });
  }
}
