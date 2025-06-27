import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { getAccessibleProposalIdsForFreeSpace } from '../getAccessibleProposalIdsForFreeSpace';

describe('getAccessibleProposalIdsForFreeSpace', () => {
  it('Should return all proposals at discussion stage and beyond, except templates and drafts', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    const { page, ...proposal1 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'published'
    });

    const { page: page2, ...draftProposal1 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'draft'
    });

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'published'
    });

    const proposals = await getAccessibleProposalIdsForFreeSpace({
      spaceId: space.id,
      userId: user.id
    });

    const expectedProposals = [proposal1.id];
    expect(proposals.length).toBe(expectedProposals.length);

    expect(proposals).toEqual(expectedProposals);
  });

  it('should not return drafts if user is not an author', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const { id: testProposalId } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    await testUtilsProposals.generateProposal({
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
    });

    const proposals = await getAccessibleProposalIdsForFreeSpace({
      spaceId: space.id,
      userId: user.id
    });

    expect(proposals.length).toBe(1);

    expect(proposals).toEqual([testProposalId]);
  });

  it('should return all proposals to the admin', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    const { id: proposalId } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const { id: draftProposalId } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'draft'
    });
    const proposals = await getAccessibleProposalIdsForFreeSpace({
      spaceId: space.id,
      userId: adminUser.id
    });

    expect(proposals.length).toBe(2);

    expect(proposals).toEqual([proposalId, draftProposalId]);
  });

  it('should return the proposals where a user is an author or reviewer for current step if onlyAssigned is true', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const user = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const { page, ...proposalByAdmin } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'published'
    });

    const { page: page2, ...proposalByUser } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'published'
    });

    const { page: page3, ...proposalByAdminReviewedByUser } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          permissions: [],
          reviewers: [
            {
              group: 'user',
              id: user.id
            }
          ]
        }
      ],
      proposalStatus: 'published'
    });

    // Admin user test
    const proposalsRequestedByAdmin = await getAccessibleProposalIdsForFreeSpace({
      spaceId: space.id,
      userId: adminUser.id,
      onlyAssigned: true
    });

    const expectedAdminProposals = [proposalByAdmin, proposalByAdminReviewedByUser];

    expect(proposalsRequestedByAdmin.length).toBe(expectedAdminProposals.length);

    expect(proposalsRequestedByAdmin).toEqual(
      expect.arrayContaining([proposalByAdmin.id, proposalByAdminReviewedByUser.id])
    );

    // Normal user test
    const proposalsRequestedByUser = await getAccessibleProposalIdsForFreeSpace({
      spaceId: space.id,
      userId: user.id,
      onlyAssigned: true
    });
    expect(proposalsRequestedByUser).toEqual(
      expect.arrayContaining([proposalByUser.id, proposalByAdminReviewedByUser.id])
    );
  });
});
