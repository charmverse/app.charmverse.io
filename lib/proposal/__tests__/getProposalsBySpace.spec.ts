import { prisma } from '@charmverse/core';
import type { Proposal, ProposalCategory, Space, User } from '@prisma/client';

import { createUserFromWallet } from 'lib/users/createUser';
import { createProposalWithUsers, generateUserAndSpace, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { createProposalTemplate } from '../../templates/proposals/createProposalTemplate';
import { createProposal } from '../createProposal';
import { getProposalsBySpace } from '../getProposalsBySpace';

let user: User;
let space: Space;
let proposalCategory: ProposalCategory;
let proposal: Proposal;
let secondProposalCategory: ProposalCategory;
let secondProposal: Proposal;

beforeAll(async () => {
  // Not a space admin
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
  secondProposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
  proposal = await generateProposal({
    spaceId: space.id,
    userId: user.id,
    categoryId: proposalCategory.id,
    proposalStatus: 'discussion'
  });
  secondProposal = await generateProposal({
    spaceId: space.id,
    userId: user.id,
    categoryId: secondProposalCategory.id,
    proposalStatus: 'discussion'
  });
});

describe('getProposalsBySpace', () => {
  it('Get all proposals of a space in given categories, excluding draft proposals', async () => {
    const allProposals = await getProposalsBySpace({
      spaceId: space.id,
      categoryIds: undefined
    });

    const draftProposal = await generateProposal({
      categoryId: proposalCategory.id,
      spaceId: space.id,
      userId: user.id,
      proposalStatus: 'draft'
    });

    expect(allProposals.length).toBe(2);
    expect(allProposals.some((p) => p.id === proposal.id)).toBe(true);
    expect(allProposals.some((p) => p.id === secondProposal.id)).toBe(true);

    const proposalsInCategory = await getProposalsBySpace({
      spaceId: space.id,
      categoryIds: proposalCategory.id
    });

    expect(proposalsInCategory.length).toBe(1);
    expect(proposalsInCategory.some((p) => p.id === proposal.id)).toBe(true);
  });

  it('should not return proposal templates', async () => {
    const template = await createProposalTemplate({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory.id
    });

    const proposals = await getProposalsBySpace({
      spaceId: space.id,
      categoryIds: [proposalCategory.id]
    });

    expect(proposals.length).toBe(1);
    expect(proposals[0].id).toBe(proposal.id);
  });
});
