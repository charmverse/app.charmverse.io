import { SystemError } from './errors';

export class PositiveNumbersOnlyError extends SystemError {
  constructor () {
    super({
      errorType: 'Invalid input',
      message: 'You must provide a positive number',
      severity: 'warning'
    });
  }
}
