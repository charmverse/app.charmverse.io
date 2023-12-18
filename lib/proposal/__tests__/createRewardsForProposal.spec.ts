import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { createRewardsForProposal } from 'lib/proposal/createRewardsForProposal';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposal } from '../createProposal';

let user: User;
let space: Space;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
});

describe('Creates rewards for proposal with pending rewards', () => {
  it('Create a page and proposal in a specific category, accepting page content, reviewers, authors and source template ID as input', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const pageTitle = 'page title 124';

    const { proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: pageTitle
      },
      categoryId: proposalCategory.id,
      userId: user.id,
      spaceId: space.id,
      authors: [user.id, extraUser.id],
      reviewers: [
        {
          group: 'user',
          id: reviewerUser.id
        }
      ],
      fields: {
        pendingRewards: [
          {
            draftId: '1',
            reward: {
              chainId: 1,
              rewardAmount: 1337,
              rewardToken: 'ETH'
            },
            page: {
              title: 'milestone reward 1',
              contentText: '',
              content: null,
              type: 'bounty'
            }
          }
        ],
        properties: {}
      }
    });

    const updatedProposal = await createRewardsForProposal({ proposalId: proposal.id, userId: reviewerUser.id });
    const rewardPage = await prisma.page.findFirst({ where: { bountyId: updatedProposal.rewards[0].id } });

    expect((updatedProposal.fields as any)?.pendingRewards).toHaveLength(0);
    expect(updatedProposal.rewards).toHaveLength(1);
    expect(rewardPage?.title).toBe('milestone reward 1');
  });

  it('Should not allow to create rewards if user is not reviewer', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const { proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: 'proposal 2'
      },
      categoryId: proposalCategory.id,
      userId: user.id,
      spaceId: space.id,
      authors: [user.id, extraUser.id],
      reviewers: [
        {
          group: 'user',
          id: reviewerUser.id
        }
      ],
      fields: {
        pendingRewards: [
          {
            draftId: '1',
            reward: {
              chainId: 1,
              rewardAmount: 1337,
              rewardToken: 'ETH'
            },
            page: {
              title: 'milestone reward 1',
              contentText: '',
              content: null,
              type: 'bounty'
            }
          }
        ],
        properties: {}
      }
    });

    await expect(createRewardsForProposal({ proposalId: proposal.id, userId: extraUser.id })).rejects.toThrowError();
    await expect(createRewardsForProposal({ proposalId: proposal.id, userId: user.id })).rejects.toThrowError();
  });
});
