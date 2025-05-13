import { SystemError } from '@packages/utils/errors';

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
