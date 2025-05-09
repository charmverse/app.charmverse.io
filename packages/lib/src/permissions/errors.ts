import { SystemError } from '@packages/utils/errors';

import type { AssignablePermissionGroups, AssignablePermissionGroupsWithPublic } from './interfaces';

export class InvalidPermissionGranteeError extends SystemError {
  constructor() {
    super({
      errorType: 'Invalid input',
      message: 'Permissions must be linked to one, and only one of a user, role or space',
      severity: 'warning'
    });
  }
}

export class AssignmentNotPermittedError extends SystemError {
  constructor(group: AssignablePermissionGroupsWithPublic) {
    super({
      errorType: 'Invalid input',
      message: `This permission assignment to ${group} is invalid or unauthorised`,
      severity: 'warning'
    });
  }
}

export class AssignableToRolesOnlyError extends SystemError {
  constructor(permissionName: string) {
    super({
      errorType: 'Invalid input',
      message: `${permissionName} permission can only be assigned to roles`,
      severity: 'warning'
    });
  }
}

export class SpaceMembershipRequiredError extends SystemError {
  constructor(message?: string) {
    super({
      errorType: 'Insecure operation',
      message: message ?? 'User must be a member of the space to perform this action.',
      severity: 'warning'
    });
  }
}
