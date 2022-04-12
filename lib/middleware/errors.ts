import { SystemError } from 'lib/utilities/errors';

export class SpaceAccessDeniedError extends SystemError {

  constructor () {
    super({
      severity: 'warning',
      errorType: 'Access denied',
      message: 'You do not have access to this space. Try again with a different user or API token'
    });
  }
}
