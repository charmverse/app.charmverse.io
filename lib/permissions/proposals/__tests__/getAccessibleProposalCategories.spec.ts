import type { ProposalCategoryWithPermissions } from '@charmverse/core';
import { AvailableProposalCategoryPermissions, testUtilsProposals, testUtilsUser } from '@charmverse/core';
import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';

import { InvalidInputError } from 'lib/utilities/errors';

import { getAccessibleProposalCategories } from '../getAccessibleProposalCategories';

let space: Space;
let adminUser: User;
let spaceMemberUser: User;

let proposalCategory: ProposalCategory;
let secondProposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;

  spaceMemberUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

  proposalCategory = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
  secondProposalCategory = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
});

describe('getAccessibleProposalCategories', () => {
  it('should return all categories for a space member, with the ability to create a post', async () => {
    const categories = await getAccessibleProposalCategories({
      spaceId: space.id,
      userId: spaceMemberUser.id
    });

    expect(categories.length).toBe(2);

    const permissions = new AvailableProposalCategoryPermissions();

    permissions.addPermissions(['create_proposal']);

    expect(categories).toEqual(
      expect.arrayContaining<ProposalCategoryWithPermissions>([
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...proposalCategory,
          permissions: permissions.operationFlags
        }),
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...secondProposalCategory,
          permissions: permissions.operationFlags
        })
      ])
    );
  });

  it('should return all categories for a space admin, with all permissions except manage_permissions', async () => {
    const categories = await getAccessibleProposalCategories({
      spaceId: space.id,
      userId: adminUser.id
    });

    expect(categories.length).toBe(2);

    const permissions = new AvailableProposalCategoryPermissions();

    const adminPermissions = {
      ...permissions.full,
      manage_permissions: false
    };

    expect(categories).toEqual(
      expect.arrayContaining<ProposalCategoryWithPermissions>([
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...proposalCategory,
          permissions: adminPermissions
        }),
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...secondProposalCategory,
          permissions: adminPermissions
        })
      ])
    );
  });

  it('should return all categories for a public user, with empty permissions', async () => {
    const categories = await getAccessibleProposalCategories({
      spaceId: space.id,
      userId: undefined
    });

    expect(categories.length).toBe(2);

    const permissions = new AvailableProposalCategoryPermissions();

    expect(categories).toEqual(
      expect.arrayContaining<ProposalCategoryWithPermissions>([
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...proposalCategory,
          permissions: permissions.empty
        }),
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...secondProposalCategory,
          permissions: permissions.empty
        })
      ])
    );
  });
  it('should throw an error if the spaceID is undefined or invalid', async () => {
    await expect(
      getAccessibleProposalCategories({
        spaceId: undefined as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      getAccessibleProposalCategories({
        spaceId: 'invalid-uuid'
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
