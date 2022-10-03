import type { UserPermissionFlags } from './interfaces';

/**
 * Defines each operation as a member property queryable as true / false
 */
export abstract class Permissions<O extends string> {

  get empty (): UserPermissionFlags<O, false> {
    return (Object.keys(this.operations) as O[]).reduce((flags, operation) => {
      flags[operation] = false;
      return flags;
    }, {} as UserPermissionFlags<O, false>);
  }

  get full (): UserPermissionFlags<O, true> {
    return (Object.keys(this.operations) as O[]).reduce((flags, operation) => {
      flags[operation] = true;
      return flags;
    }, {} as UserPermissionFlags<O, true>);
  }

  get operationFlags (): UserPermissionFlags<O> {
    return (Object.keys(this.operations) as O[]).reduce((flags, operation) => {
      flags[operation] = (this as any)[operation];
      return flags;
    }, {} as UserPermissionFlags<O>);
  }

  private operations: { [key in O]: true };

  constructor ({ allowedOperations }: { allowedOperations: O[] }) {
    this.operations = allowedOperations.reduce((map, key) => {
      map[key] = true;
      return map;
    }, {} as any);
  }

  addPermissions (operations: O [] | Partial<UserPermissionFlags<O>>) {

    if (operations instanceof Array) {
      operations.forEach((opName) => {
        if (this.operations[opName]) {
          (this as any)[opName] = true;
        }
      });
    }
    else {
      const opKeys = Object.keys(operations) as O [];
      opKeys.forEach(opName => {

        if (this.operations[opName] && operations[opName] === true) {
          (this as any)[opName] = true;
        }

      });
    }
  }

  /**
   * Given a list of operations, indicates if all these are available in current permission set
   */
  hasPermissions (operations: O []): boolean {
    for (const op of operations) {
      if ((this as any)[op] !== true) {
        return false;
      }
    }

    return true;
  }
}
