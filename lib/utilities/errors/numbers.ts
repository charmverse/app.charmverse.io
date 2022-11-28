import { SystemError } from './errors';

export class PositiveNumbersOnlyError extends SystemError {
  constructor() {
    super({
      errorType: 'Invalid input',
      message: 'You must provide a positive number',
      severity: 'warning'
    });
  }
}

export class LimitReachedError extends SystemError {
  constructor(message = 'The limit for this operation has been reached.') {
    super({
      errorType: 'Invalid input',
      message,
      severity: 'warning'
    });
  }
}
