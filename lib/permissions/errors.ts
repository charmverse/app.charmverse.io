import { SystemError } from 'lib/utilities/errors';

export class InvalidPermissionGranteeError extends SystemError {

  constructor () {
    super({
      errorType: 'Invalid input',
      message: 'Permissions must be linked to one, and only one of a user, role or space',
      severity: 'warning'
    });
  }
}

export class SpaceMembershipRequiredError extends SystemError {

  constructor (message?: string) {
    super({
      errorType: 'Insecure operation',
      message: message ?? 'User must be a member of the space to perform this action.',
      severity: 'warning'
    });
  }
}
