import { SystemError } from '@packages/utils/errors';

export class AdministratorOnlyError extends SystemError {
  constructor() {
    super({
      errorType: 'Access denied',
      message: 'Only space administrators can perform this action',
      severity: 'warning'
    });
  }
}

export class UserIsNotSpaceMemberError extends SystemError {
  constructor() {
    super({
      errorType: 'Access denied',
      message: 'User does not have access to this space',
      severity: 'warning'
    });
  }
}

export class UserIsGuestError extends SystemError {
  constructor() {
    super({
      errorType: 'Access denied',
      message: 'User is only a guest within this space',
      severity: 'warning'
    });
  }
}
