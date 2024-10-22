import { typedKeys } from '@root/lib/utils/objects';

import type { AbstractPermissions, UserPermissionFlags } from './interfaces';

/**
 * Defines each operation as a member property queryable as true / false
 *
 * @abstract Replaces permissions.class.ts -- A future PR should switch over all Permission classes that inherit from Permissions to use this instead
 */
export abstract class BasePermissions<O extends string> implements AbstractPermissions<O> {
  get empty(): UserPermissionFlags<O, false> {
    return typedKeys(this.operations).reduce(
      (flags, operation) => {
        flags[operation] = false;
        return flags;
      },
      {} as UserPermissionFlags<O, false>
    );
  }

  get full(): UserPermissionFlags<O, true> {
    return typedKeys(this.operations).reduce(
      (flags, operation) => {
        flags[operation] = true;
        return flags;
      },
      {} as UserPermissionFlags<O, true>
    );
  }

  get operationFlags(): UserPermissionFlags<O> {
    return this.operations;
  }

  private operations: { [key in O]: boolean };

  // Defines available operations. All will be initialized as false
  constructor({ allowedOperations }: { allowedOperations: O[] }) {
    this.operations = allowedOperations.reduce((map, key) => {
      map[key] = false;
      return map;
    }, {} as any);
  }

  addPermissions(operations: O[] | Partial<UserPermissionFlags<O>>) {
    if (operations instanceof Array) {
      operations.forEach((opName) => {
        if (typeof this.operations[opName] === 'boolean') {
          this.operations[opName] = true;
        }
      });
    } else {
      typedKeys(operations).forEach((opName) => {
        if (typeof this.operations[opName] === 'boolean') {
          this.operations[opName] = true;
        }
      });
    }
  }

  /**
   * Given a list of operations, indicates if all these are available in current permission set
   */
  hasPermissions(operations: O[]): boolean {
    for (const op of operations) {
      if (this.operations[op] !== true) {
        return false;
      }
    }

    return true;
  }
}
