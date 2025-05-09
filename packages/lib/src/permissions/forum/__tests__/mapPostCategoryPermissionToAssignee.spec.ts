import type { AssignedPostCategoryPermission } from '@charmverse/core/permissions';
import type { PostCategoryPermission } from '@charmverse/core/prisma';
import { ExpectedAnError } from '@packages/testing/errors';
import { InvalidPermissionGranteeError } from '@packages/lib/permissions/errors';
import { v4 } from 'uuid';

import { mapPostCategoryPermissionToAssignee } from '../mapPostCategoryPermissionToAssignee';

describe('mapPostCategoryPermissionToAssignee', () => {
  it('should map a public permission', () => {
    const input: PostCategoryPermission = {
      id: v4(),
      postCategoryId: v4(),
      public: true,
      roleId: null,
      spaceId: null,
      permissionLevel: 'view',
      postOperations: [],
      categoryOperations: []
    };

    const mapped = mapPostCategoryPermissionToAssignee(input);

    expect(mapped).toEqual<AssignedPostCategoryPermission>({
      id: input.id,
      postCategoryId: input.postCategoryId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'public'
      }
    });
  });

  it('should map a space permission', () => {
    const input: PostCategoryPermission = {
      id: v4(),
      postCategoryId: v4(),
      public: null,
      roleId: null,
      spaceId: v4(),
      permissionLevel: 'full_access',
      postOperations: [],
      categoryOperations: []
    };

    const mapped = mapPostCategoryPermissionToAssignee(input);

    expect(mapped).toEqual<AssignedPostCategoryPermission>({
      id: input.id,
      postCategoryId: input.postCategoryId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'space',
        id: input.spaceId as string
      }
    });
  });

  it('should map a role permission', () => {
    const input: PostCategoryPermission = {
      id: v4(),
      postCategoryId: v4(),
      public: null,
      roleId: v4(),
      spaceId: null,
      permissionLevel: 'full_access',
      postOperations: [],
      categoryOperations: []
    };

    const mapped = mapPostCategoryPermissionToAssignee(input);

    expect(mapped).toEqual<AssignedPostCategoryPermission>({
      id: input.id,
      postCategoryId: input.postCategoryId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'role',
        id: input.roleId as string
      }
    });
  });
  it('should throw an error if the permission is assigned to no-one, or more than one group', () => {
    try {
      const emptyInput: PostCategoryPermission = {
        id: v4(),
        postCategoryId: v4(),
        // Nobody is assigned
        public: null,
        roleId: null,
        spaceId: null,
        permissionLevel: 'full_access',
        postOperations: [],
        categoryOperations: []
      };

      mapPostCategoryPermissionToAssignee(emptyInput);

      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidPermissionGranteeError);
    }
    try {
      const fullInput: PostCategoryPermission = {
        id: v4(),
        postCategoryId: v4(),
        // More than one is assigned
        public: true,
        roleId: v4(),
        spaceId: v4(),
        permissionLevel: 'full_access',
        postOperations: [],
        categoryOperations: []
      };

      mapPostCategoryPermissionToAssignee(fullInput);

      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(ExpectedAnError);
    }
  });
});
