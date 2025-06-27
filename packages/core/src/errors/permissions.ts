import { SystemError } from './errors';

export class InvalidPermissionGranteeError extends SystemError {
  constructor() {
    super({
      errorType: 'Invalid input',
      message: 'Permissions must be linked to one, and only one of a user, role or space',
      severity: 'warning'
    });
  }
}
