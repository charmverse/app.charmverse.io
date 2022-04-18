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

export class PermissionNotFoundError extends SystemError {

  constructor (permissionId: string) {
    super({
      errorType: 'Data not found',
      message: `Could not find permission with ID ${permissionId}`,
      severity: 'warning'
    });
  }
}
