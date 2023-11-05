import type { ProposalCategoryWithPermissions } from '@charmverse/core/permissions';
import { AvailableProposalCategoryPermissions } from '@charmverse/core/permissions';
import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsUser, testUtilsProposals } from '@charmverse/core/test';

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
  it('should return all categories for a space member, with the ability to create a post, view a category, comment and vote on proposals', async () => {
    const categories = await getAccessibleProposalCategories({
      spaceId: space.id,
      userId: spaceMemberUser.id
    });

    expect(categories.length).toBe(2);

    const permissions = new AvailableProposalCategoryPermissions().addPermissions([
      'create_proposal',
      'view_category',
      'comment_proposals',
      'vote_proposals'
    ]).operationFlags;

    expect(categories).toEqual(
      expect.arrayContaining<ProposalCategoryWithPermissions>([
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...proposalCategory,
          permissions
        }),
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...secondProposalCategory,
          permissions
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

  it('should return all categories for a public user, with view permissions', async () => {
    const categories = await getAccessibleProposalCategories({
      spaceId: space.id,
      userId: undefined
    });

    expect(categories.length).toBe(2);

    const permissions = new AvailableProposalCategoryPermissions().addPermissions(['view_category']).operationFlags;

    expect(categories).toEqual(
      expect.arrayContaining<ProposalCategoryWithPermissions>([
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...proposalCategory,
          permissions
        }),
        expect.objectContaining<ProposalCategoryWithPermissions>({
          ...secondProposalCategory,
          permissions
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
