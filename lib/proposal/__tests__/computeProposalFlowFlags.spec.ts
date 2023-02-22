import type { ProposalCategory, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { assignRole } from 'lib/roles';
import { createUserFromWallet } from 'lib/users/createUser';
import { createProposalWithUsers, generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory, generateProposal } from 'testing/utils/proposals';

import { computeProposalFlowFlags } from '../computeProposalFlowFlags';

let admin: User;
let author: User;
let reviewer1: User;
let reviewer2: User;
let space: Space;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const { user: user1, space: generatedSpace } = await generateUserAndSpaceWithApiToken();

  admin = user1;
  author = await createUserFromWallet();
  reviewer1 = await createUserFromWallet();
  reviewer2 = await createUserFromWallet();

  await prisma?.spaceRole.createMany({
    data: [author, reviewer1, reviewer2].map((user) => ({
      spaceId: generatedSpace.id,
      userId: user.id,
      isAdmin: false
    }))
  });

  space = generatedSpace;
  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
});

describe('Validate if the user can update the status of the proposal', () => {
  it('Proposal author should be able to change the proposal status from private_draft to draft', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer1.id]
    });

    const flowFlags = await computeProposalFlowFlags({
      proposalId: pageWithProposal.proposal!.id,
      userId: author.id
    });

    expect(flowFlags.draft).toBe(true);
  });

  it('Proposal reviewer should be able to change the proposal status from review to reviewed', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer1.id],
      proposalStatus: 'review'
    });

    const flowFlags = await computeProposalFlowFlags({
      proposalId: pageWithProposal.proposal!.id,
      userId: reviewer1.id
    });

    expect(flowFlags.reviewed).toBe(true);
  });

  it('Proposal reviewer with roleId should be able to change the proposal status from review to reviewed', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: author.id
    });

    await assignRole({
      roleId: role.id,
      userId: reviewer1.id
    });

    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [
        {
          type: 'role',
          roleId: role.id
        }
      ],
      proposalStatus: 'review'
    });

    const flowFlags = await computeProposalFlowFlags({
      proposalId: pageWithProposal.proposal!.id,
      userId: reviewer1.id
    });

    expect(flowFlags.reviewed).toBe(true);
  });

  it('Proposal author should not be able to change the proposal status from review to reviewed', async () => {
    // Create a test proposal first
    const proposal = await generateProposal({
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

    const flowFlags = await computeProposalFlowFlags({
      proposalId: proposal.id,
      userId: author.id
    });

    expect(flowFlags.reviewed).toBe(false);
  });

  it("Proposal reviewer (userId) shouldn't be able to change the proposal status from private_draft to draft", async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author.id,
      authors: [],
      reviewers: [reviewer1.id]
    });

    const flowFlags = await computeProposalFlowFlags({
      proposalId: pageWithProposal.proposal!.id,
      userId: reviewer1.id
    });

    expect(flowFlags.private_draft).toBe(false);
  });

  it('should return false for the review status if the proposal is in discussion stage, but no reviewers exist', async () => {
    const proposal = await generateProposal({
      spaceId: space.id,
      userId: author.id,
      categoryId: proposalCategory.id,
      proposalStatus: 'discussion'
    });

    const flowFlags = await computeProposalFlowFlags({
      proposalId: proposal.id,
      userId: author.id
    });

    expect(flowFlags.review).toBe(false);
  });
});
