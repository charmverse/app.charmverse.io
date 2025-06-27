import type { PagePermission } from '@charmverse/core/prisma';
import { ExpectedAnError, InvalidPermissionGranteeError } from '@packages/core/errors';
import type { AssignedPagePermission } from '@packages/core/permissions';
import { v4 } from 'uuid';

import { mapPagePermissionToAssignee } from '../mapPagePermissionToAssignee';

describe('mapPagePermissionToAssignee', () => {
  it('should map the sourcePermission value', () => {
    const sourcePermission: PagePermission = {
      id: v4(),
      inheritedFromPermission: v4(),
      pageId: v4(),
      permissions: [],
      userId: null,
      public: true,
      roleId: null,
      spaceId: null,
      permissionLevel: 'view',
      allowDiscovery: false
    };

    const input: PagePermission = {
      id: v4(),
      inheritedFromPermission: sourcePermission.id,
      pageId: v4(),
      permissions: [],
      userId: null,
      public: true,
      roleId: null,
      spaceId: null,
      permissionLevel: 'view',
      allowDiscovery: false
    };

    const mapped = mapPagePermissionToAssignee({ permission: { ...input, sourcePermission } });

    expect(mapped).toEqual<AssignedPagePermission>({
      id: input.id,
      pageId: input.pageId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'public'
      },
      sourcePermission,
      allowDiscovery: false
    });
  });
  it('should map a public permission', () => {
    const input: PagePermission = {
      id: v4(),
      inheritedFromPermission: null,
      pageId: v4(),
      permissions: [],
      userId: null,
      public: true,
      roleId: null,
      spaceId: null,
      permissionLevel: 'view',
      allowDiscovery: false
    };

    const mapped = mapPagePermissionToAssignee({ permission: input });

    expect(mapped).toEqual<AssignedPagePermission>({
      id: input.id,
      pageId: input.pageId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'public'
      },
      allowDiscovery: false
    });
  });

  it('should map a space permission', () => {
    const input: PagePermission & { spaceId: string } = {
      id: v4(),
      inheritedFromPermission: null,
      pageId: v4(),
      permissions: [],
      userId: null,
      public: true,
      roleId: null,
      spaceId: v4(),
      permissionLevel: 'view',
      allowDiscovery: false
    };

    const mapped = mapPagePermissionToAssignee({ permission: input });

    expect(mapped).toEqual<AssignedPagePermission>({
      id: input.id,
      pageId: input.pageId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'space',
        id: input.spaceId
      },
      allowDiscovery: false
    });
  });

  it('should map a role permission', () => {
    const input: PagePermission & { roleId: string } = {
      id: v4(),
      inheritedFromPermission: null,
      pageId: v4(),
      permissions: [],
      userId: null,
      public: true,
      roleId: v4(),
      spaceId: null,
      permissionLevel: 'view',
      allowDiscovery: false
    };

    const mapped = mapPagePermissionToAssignee({ permission: input });

    expect(mapped).toEqual<AssignedPagePermission>({
      id: input.id,
      pageId: input.pageId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'role',
        id: input.roleId
      },
      allowDiscovery: false
    });
  });

  it('should map a user permission', () => {
    const input: PagePermission & { userId: string } = {
      id: v4(),
      inheritedFromPermission: null,
      pageId: v4(),
      permissions: [],
      userId: v4(),
      public: true,
      roleId: null,
      spaceId: null,
      permissionLevel: 'view',
      allowDiscovery: false
    };

    const mapped = mapPagePermissionToAssignee({ permission: input });

    expect(mapped).toEqual<AssignedPagePermission>({
      id: input.id,
      pageId: input.pageId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'user',
        id: input.userId
      },
      allowDiscovery: false
    });
  });
  it('should throw an error if the permission is assigned to no-one, or more than one group', () => {
    try {
      const emptyInput: PagePermission = {
        id: v4(),
        inheritedFromPermission: null,
        pageId: v4(),
        userId: null,
        // Nobody is assigned
        public: null,
        roleId: null,
        spaceId: null,
        permissionLevel: 'full_access',
        permissions: [],
        allowDiscovery: false
      };

      mapPagePermissionToAssignee({ permission: emptyInput });

      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidPermissionGranteeError);
    }
    try {
      const fullInput: PagePermission = {
        id: v4(),
        inheritedFromPermission: null,
        pageId: v4(),
        userId: v4(),
        // Nobody is assigned
        public: true,
        roleId: v4(),
        spaceId: v4(),
        permissionLevel: 'full_access',
        permissions: [],
        allowDiscovery: false
      };

      mapPagePermissionToAssignee({ permission: fullInput });

      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(ExpectedAnError);
    }
  });
});
