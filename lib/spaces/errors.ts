import { SystemError } from 'lib/utilities/errors';

export class MinimumOneSpaceAdminRequiredError extends SystemError {

  constructor () {
    super({
      message: 'Spaces must have at least one administrator',
      errorType: 'Undesirable operation',
      severity: 'warning'
    });
  }
}
