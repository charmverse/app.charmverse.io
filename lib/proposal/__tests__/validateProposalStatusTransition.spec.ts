import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { assignRole } from 'lib/roles';
import { createUserFromWallet } from 'lib/users/createUser';
import { createProposalWithUsers, generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { validateProposalStatusTransition } from '../validateProposalStatusTransition';

let author1: User;
let author2: User;
let reviewer1: User;
let reviewer2: User;
let space: Space;

beforeAll(async () => {
  const { user: user1, space: generatedSpace } = await generateUserAndSpaceWithApiToken();

  author1 = user1;
  author2 = await createUserFromWallet(v4());
  reviewer1 = await createUserFromWallet(v4());
  reviewer2 = await createUserFromWallet(v4());

  await prisma?.spaceRole.createMany({
    data: [author2, reviewer1, reviewer2].map(user => ({ spaceId: generatedSpace.id, userId: user.id }))
  });

  space = generatedSpace;
});

describe('Validate if the user can update the status of the proposal', () => {
  it('Proposal author should be able to change the proposal status from private_draft to draft', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer1.id]
    });

    const canChangeStatus = await validateProposalStatusTransition({
      proposal: pageWithProposal.proposal!,
      newStatus: 'draft',
      userId: author1.id
    });

    expect(canChangeStatus).toBe(true);
  });

  it('Proposal reviewer should be able to change the proposal status from review to reviewed', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer1.id],
      proposalStatus: 'review'
    });

    const canChangeStatus = await validateProposalStatusTransition({
      proposal: pageWithProposal.proposal!,
      newStatus: 'reviewed',
      userId: reviewer1.id
    });

    expect(canChangeStatus).toBe(true);
  });

  it('Proposal reviewer with roleId should be able to change the proposal status from review to reviewed', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: author1.id
    });

    await assignRole({
      roleId: role.id,
      userId: reviewer1.id
    });

    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [{
        type: 'role',
        roleId: role.id
      }],
      proposalStatus: 'review'
    });

    const canChangeStatus = await validateProposalStatusTransition({
      proposal: pageWithProposal.proposal!,
      newStatus: 'reviewed',
      userId: reviewer1.id
    });

    expect(canChangeStatus).toBe(true);
  });

  it('Proposal author shouldn\'t be able to change the proposal status from review to reviewed', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer1.id],
      proposalStatus: 'review'
    });

    const canChangeStatus = await validateProposalStatusTransition({
      proposal: pageWithProposal.proposal!,
      newStatus: 'reviewed',
      userId: author1.id
    });

    expect(canChangeStatus).toBe(false);
  });

  it('Proposal reviewer (userId) shouldn\'t be able to change the proposal status from private_draft to draft', async () => {
    // Create a test proposal first
    const pageWithProposal = await createProposalWithUsers({
      spaceId: space.id,
      userId: author1.id,
      authors: [],
      reviewers: [reviewer1.id]
    });

    const canChangeStatus = await validateProposalStatusTransition({
      proposal: pageWithProposal.proposal!,
      newStatus: 'draft',
      userId: reviewer1.id
    });

    expect(canChangeStatus).toBe(false);
  });
});
