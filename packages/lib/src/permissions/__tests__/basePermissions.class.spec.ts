import { BasePermissions } from '../basePermissions.class';

type Operation = 'read' | 'write' | 'delete';

const operations: Operation[] = ['read', 'write', 'delete'];

class TestClass extends BasePermissions<Operation> {
  constructor() {
    super({
      allowedOperations: operations
    });
  }
}

describe('basePermissions', () => {
  it('should instantiate a permission set with a list of operations and only allow using these', () => {
    const permissions = new TestClass();

    expect(permissions.operationFlags).toEqual({
      read: false,
      write: false,
      delete: false
    });

    // Add an inexistent permission
    permissions.addPermissions(['random' as any]);

    expect((permissions.operationFlags as any).random).toBeUndefined();

    permissions.addPermissions(['write']);

    expect(permissions.operationFlags).toEqual({
      read: false,
      write: true,
      delete: false
    });
  });

  it('should check if a certain set of permissions are assigned', () => {
    const permissions = new TestClass();

    permissions.addPermissions(['read']);

    expect(permissions.hasPermissions(['read'])).toBe(true);
    expect(permissions.hasPermissions(['read', 'write'])).toBe(false);
  });
});
