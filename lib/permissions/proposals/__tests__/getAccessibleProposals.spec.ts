import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { getAccessibleProposals } from '../getAccessibleProposals';

describe('getAccessibleProposals', () => {
  it('Should return all proposals at discussion stage and beyond, except templates and drafts', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const proposalCategory1 = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const { page, ...proposal1 } = await testUtilsProposals.generateProposal({
      categoryId: proposalCategory1.id,
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'discussion'
    });

    const { page: page2, ...draftProposal1 } = await testUtilsProposals.generateProposal({
      categoryId: proposalCategory1.id,
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'draft'
    });

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      categoryId: proposalCategory1.id,
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'discussion'
    });

    const proposals = await getAccessibleProposals({
      spaceId: space.id,
      userId: user.id
    });

    const expectedProposals = [proposal1];
    expect(proposals.length).toBe(expectedProposals.length);

    expect(proposals).toEqual(expect.arrayContaining(expectedProposals.map((p) => expect.objectContaining(p))));
  });

  it('should not return drafts if user is not an author', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const proposalCategory1 = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const { page, ...proposalCategory1ProposalAuthoredByUser } = await testUtilsProposals.generateProposal({
      categoryId: proposalCategory1.id,
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'discussion'
    });
    const { page: page2, ...proposalCategory1DraftProposalAuthoredByAdmin } = await testUtilsProposals.generateProposal(
      {
        categoryId: proposalCategory1.id,
        spaceId: space.id,
        userId: adminUser.id,
        proposalStatus: 'draft',
        reviewers: [
          // User shouldn't see this yet since it's a draft
          {
            group: 'user',
            id: user.id
          }
        ]
      }
    );

    const proposals = await getAccessibleProposals({
      spaceId: space.id,
      userId: user.id
    });

    const expectedProposals = [proposalCategory1ProposalAuthoredByUser];
    expect(proposals.length).toBe(expectedProposals.length);

    expect(proposals).toEqual(expect.arrayContaining(expectedProposals.map((p) => expect.objectContaining(p))));
  });

  it('should return all proposals to the admin', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const invisibleProposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const { page, ...invisibleCategoryProposalAuthoredByUser } = await testUtilsProposals.generateProposal({
      categoryId: invisibleProposalCategory.id,
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'discussion'
    });

    const { page: page2, ...invisibleCategoryDraftProposalAuthoredByUser } = await testUtilsProposals.generateProposal({
      categoryId: invisibleProposalCategory.id,
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'draft'
    });
    const proposals = await getAccessibleProposals({
      spaceId: space.id,
      userId: adminUser.id
    });

    const expectedProposals = [invisibleCategoryProposalAuthoredByUser, invisibleCategoryDraftProposalAuthoredByUser];
    expect(proposals.length).toBe(expectedProposals.length);

    expect(proposals).toEqual(expect.arrayContaining(expectedProposals.map((p) => expect.objectContaining(p))));
  });

  it('should return only proposals from specified categories if categoryIds are provided', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const category1 = await testUtilsProposals.generateProposalCategory({
      title: 'Visible Category 1',
      spaceId: space.id
    });

    const { page, ...proposal } = await testUtilsProposals.generateProposal({
      categoryId: category1.id,
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'discussion'
    });

    const category2 = await testUtilsProposals.generateProposalCategory({
      title: 'Visible Category 2',
      spaceId: space.id
    });

    const { page: page2, ...proposal2 } = await testUtilsProposals.generateProposal({
      categoryId: category2.id,
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'discussion'
    });
    // Admin user test
    const proposalsRequestedByAdmin = await getAccessibleProposals({
      spaceId: space.id,
      userId: adminUser.id,
      categoryIds: [category1.id]
    });

    expect(proposalsRequestedByAdmin.length).toBe(1);

    expect(proposalsRequestedByAdmin[0]).toMatchObject(proposal);

    // Normal user test
    const proposalsRequestedByUser = await getAccessibleProposals({
      spaceId: space.id,
      userId: user.id,
      categoryIds: [category1.id]
    });
    expect(proposalsRequestedByUser.length).toBe(1);

    expect(proposalsRequestedByUser[0]).toMatchObject(proposal);
  });

  it('should return only the proposals where a user is an author if onlyAssigned is true', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const category1 = await testUtilsProposals.generateProposalCategory({
      title: 'Visible Category 1',
      spaceId: space.id
    });

    const { page, ...proposalByAdmin } = await testUtilsProposals.generateProposal({
      categoryId: category1.id,
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'discussion'
    });

    const { page: page2, ...proposalByUser } = await testUtilsProposals.generateProposal({
      categoryId: category1.id,
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'discussion'
    });

    const { page: page3, ...proposalByAdminReviewedByUser } = await testUtilsProposals.generateProposal({
      categoryId: category1.id,
      spaceId: space.id,
      userId: adminUser.id,
      reviewers: [
        {
          group: 'user',
          id: user.id
        }
      ],
      proposalStatus: 'discussion'
    });

    // Admin user test
    const proposalsRequestedByAdmin = await getAccessibleProposals({
      spaceId: space.id,
      userId: adminUser.id,
      onlyAssigned: true
    });

    const expectedAdminProposals = [proposalByAdmin, proposalByAdminReviewedByUser];

    expect(proposalsRequestedByAdmin.length).toBe(expectedAdminProposals.length);

    expect(proposalsRequestedByAdmin).toEqual(
      expect.arrayContaining([
        expect.objectContaining(proposalByAdmin),
        expect.objectContaining(proposalByAdminReviewedByUser)
      ])
    );

    // Normal user test
    const proposalsRequestedByUser = await getAccessibleProposals({
      spaceId: space.id,
      userId: user.id,
      onlyAssigned: true
    });

    const expectedUserProposals = [proposalByUser];

    expect(proposalsRequestedByUser.length).toBe(expectedUserProposals.length);

    expect(proposalsRequestedByUser).toEqual([expect.objectContaining(proposalByUser)]);
  });
});
