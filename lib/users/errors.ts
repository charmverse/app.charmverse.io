import { SystemError } from 'lib/utilities/errors';

export class AdministratorOnlyError extends SystemError {
  constructor () {
    super({
      errorType: 'Access denied',
      message: 'Only space administrators can perform this action',
      severity: 'warning'
    });
  }
}

export class UserIsNotSpaceMemberError extends SystemError {
  constructor () {
    super({
      errorType: 'Access denied',
      message: 'User does not have access to this space',
      severity: 'warning'
    });
  }
}
