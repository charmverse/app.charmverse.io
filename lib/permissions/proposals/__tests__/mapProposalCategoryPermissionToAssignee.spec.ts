import type { AssignedProposalCategoryPermission } from '@charmverse/core';
import type { ProposalCategoryPermission } from '@charmverse/core/prisma';
import { v4 } from 'uuid';

import { InvalidPermissionGranteeError } from 'lib/permissions/errors';
import { ExpectedAnError } from 'testing/errors';

import { mapProposalCategoryPermissionToAssignee } from '../mapProposalCategoryPermissionToAssignee';

describe('mapProposalCategoryPermissionToAssignee', () => {
  it('should map a public permission', () => {
    const input: ProposalCategoryPermission = {
      id: v4(),
      proposalCategoryId: v4(),
      public: true,
      roleId: null,
      spaceId: null,
      permissionLevel: 'view',
      proposalOperations: [],
      categoryOperations: []
    };

    const mapped = mapProposalCategoryPermissionToAssignee(input);

    expect(mapped).toEqual<AssignedProposalCategoryPermission>({
      id: input.id,
      proposalCategoryId: input.proposalCategoryId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'public'
      }
    });
  });

  it('should map a space permission', () => {
    const input: ProposalCategoryPermission = {
      id: v4(),
      proposalCategoryId: v4(),
      public: null,
      roleId: null,
      spaceId: v4(),
      permissionLevel: 'full_access',
      proposalOperations: [],
      categoryOperations: []
    };

    const mapped = mapProposalCategoryPermissionToAssignee(input);

    expect(mapped).toEqual<AssignedProposalCategoryPermission>({
      id: input.id,
      proposalCategoryId: input.proposalCategoryId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'space',
        id: input.spaceId as string
      }
    });
  });

  it('should map a role permission', () => {
    const input: ProposalCategoryPermission = {
      id: v4(),
      proposalCategoryId: v4(),
      public: null,
      roleId: v4(),
      spaceId: null,
      permissionLevel: 'full_access',
      proposalOperations: [],
      categoryOperations: []
    };

    const mapped = mapProposalCategoryPermissionToAssignee(input);

    expect(mapped).toEqual<AssignedProposalCategoryPermission>({
      id: input.id,
      proposalCategoryId: input.proposalCategoryId,
      permissionLevel: input.permissionLevel,
      assignee: {
        group: 'role',
        id: input.roleId as string
      }
    });
  });
  it('should throw an error if the permission is assigned to no-one, or more than one group', () => {
    try {
      const emptyInput: ProposalCategoryPermission = {
        id: v4(),
        proposalCategoryId: v4(),
        // Nobody is assigned
        public: null,
        roleId: null,
        spaceId: null,
        permissionLevel: 'full_access',
        proposalOperations: [],
        categoryOperations: []
      };

      mapProposalCategoryPermissionToAssignee(emptyInput);

      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidPermissionGranteeError);
    }
    try {
      const fullInput: ProposalCategoryPermission = {
        id: v4(),
        proposalCategoryId: v4(),
        // More than one is assigned
        public: true,
        roleId: v4(),
        spaceId: v4(),
        permissionLevel: 'full_access',
        proposalOperations: [],
        categoryOperations: []
      };

      mapProposalCategoryPermissionToAssignee(fullInput);

      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(ExpectedAnError);
    }
  });
});
