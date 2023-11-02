import type { ProposalCategory, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { exportProposalCategories } from '../exportProposalCategories';

describe('exportProposalCategories', () => {
  let space: Space;
  let user: User;

  let proposalCategory1: ProposalCategory;
  let proposalCategory2: ProposalCategory;

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace());
    proposalCategory1 = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
    proposalCategory2 = await testUtilsProposals.generateProposalCategory({ spaceId: space.id });
  });

  it('should successfully retrieve proposal categories for a given space', async () => {
    // Assuming there are already some proposal categories in the test database for this space
    const { proposalCategories } = await exportProposalCategories({ spaceIdOrDomain: space.id });

    expect(proposalCategories).toEqual(
      expect.arrayContaining<ProposalCategory>([proposalCategory1, proposalCategory2])
    );
  });

  it('should return an empty array when space has no proposal categories', async () => {
    // Creating a new space to ensure it has no proposal categories
    const { space: newSpace } = await testUtilsUser.generateUserAndSpace();

    const { proposalCategories } = await exportProposalCategories({ spaceIdOrDomain: newSpace.id });

    expect(proposalCategories).toBeDefined();
    expect(Array.isArray(proposalCategories)).toBe(true);
    expect(proposalCategories).toHaveLength(0);
  });

  it('should throw an error for invalid space identifier', async () => {
    await expect(exportProposalCategories({ spaceIdOrDomain: 'non_existing_space_id' })).rejects.toThrowError();
  });

  it('should throw an error for missing or null space identifier', async () => {
    await expect(exportProposalCategories({ spaceIdOrDomain: '' })).rejects.toThrowError();

    await expect(exportProposalCategories({ spaceIdOrDomain: null as unknown as string })).rejects.toThrowError();
  });
});
