import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { computeProposalFlowPermissions } from '../computeProposalFlowPermissions';

let admin: User;
let author: User;
let reviewer1: User;
let reviewer2: User;
let space: Space;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const { user: user1, space: generatedSpace } = await testUtilsUser.generateUserAndSpace();

  space = generatedSpace;

  admin = user1;

  author = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  reviewer1 = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  reviewer2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalCategory = await testUtilsProposals.generateProposalCategory({
    spaceId: space.id
  });
});

describe('computeProposalFlowPermissions', () => {
  it('Proposal author should be able to change the proposal status from draft to discussion', async () => {
    // Create a test proposal first
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [{ group: 'user', id: reviewer1.id }]
    });

    const flowFlags = await computeProposalFlowPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(flowFlags.draft).toBe(true);
  });

  it('Proposal reviewer should be able to change the proposal status from review to reviewed', async () => {
    // Create a test proposal first
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [{ group: 'user', id: reviewer1.id }],
      proposalStatus: 'review'
    });

    const flowFlags = await computeProposalFlowPermissions({
      resourceId: proposal.id,
      userId: reviewer1.id
    });

    expect(flowFlags.reviewed).toBe(true);
  });
  it('Proposal author should not be able to change the proposal status from review to reviewed', async () => {
    // Create a test proposal first
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      categoryId: proposalCategory.id,
      reviewers: [
        {
          group: 'user',
          id: reviewer1.id
        }
      ],
      proposalStatus: 'review'
    });

    const flowFlags = await computeProposalFlowPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(flowFlags.reviewed).toBe(false);
  });

  it("Proposal reviewer (userId) shouldn't be able to change the proposal status from draft to discussion", async () => {
    // Create a test proposal first
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [{ group: 'user', id: reviewer1.id }]
    });

    const flowFlags = await computeProposalFlowPermissions({
      resourceId: proposal.id,
      userId: reviewer1.id
    });

    expect(flowFlags.discussion).toBe(false);
  });

  it('should return false for the review status if the proposal is in draft stage, but no reviewers exist', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      categoryId: proposalCategory.id,
      proposalStatus: 'discussion'
    });

    const flowFlags = await computeProposalFlowPermissions({
      resourceId: proposal.id,
      userId: author.id
    });

    expect(flowFlags.discussion).toBe(false);
  });
});
