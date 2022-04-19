import { SystemError } from 'lib/utilities/errors';
import { PagePermissionLevel } from '@prisma/client';

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

export class InvalidPermissionLevelError extends SystemError {

  constructor (wrongPermissionLevel: string) {
    super({
      errorType: 'Invalid input',
      message: `'${wrongPermissionLevel} is an invalid permission level`,
      severity: 'warning',
      error: {
        validOptions: Object.keys(PagePermissionLevel)
      }
    });
  }
}

export class CircularPermissionError extends SystemError {

  constructor (permissionId: string, inheritsFromPermissionId: string) {
    super({
      errorType: 'Invalid input',
      message: `Circular permission inheritance is not allowed. ${permissionId} already inherits from ${inheritsFromPermissionId}`,
      severity: 'warning'
    });
  }
}

export class SelfInheritancePermissionError extends SystemError {

  constructor () {
    super({
      errorType: 'Invalid input',
      message: 'Permissions cannot inherit from themselves',
      severity: 'warning'
    });
  }
}
