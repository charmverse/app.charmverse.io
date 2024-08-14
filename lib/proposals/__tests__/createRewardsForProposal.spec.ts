import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { createRewardsForProposal } from '@root/lib/proposals/createRewardsForProposal';
import { v4 as uuid } from 'uuid';

import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { createProposal } from '../createProposal';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('Creates rewards for proposal with pending rewards', () => {
  it('Create a page and proposal accepting page content, reviewers, authors and source template ID as input', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const pageTitle = 'page title 124';

    const proposal = await testUtilsProposals.generateProposal({
      title: pageTitle,
      userId: user.id,
      spaceId: space.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          id: uuid(),
          index: 0,
          reviewers: [{ group: 'user', id: reviewerUser.id }],
          rubricCriteria: [],
          title: 'Example step',
          evaluationType: 'rubric',
          permissions: []
        }
      ],
      authors: [user.id, extraUser.id]
    });

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        fields: {
          pendingRewards: [
            {
              draftId: '1',
              reward: {
                chainId: 1,
                rewardAmount: 1337,
                rewardToken: 'ETH',
                reviewers: [{ group: 'user', id: reviewerUser.id }]
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
      }
    });

    const updatedProposal = await createRewardsForProposal({ proposalId: proposal.id, userId: reviewerUser.id });
    const rewardPage = await prisma.page.findFirst({ where: { bountyId: updatedProposal.rewards[0].id } });

    expect((updatedProposal.fields as any)?.pendingRewards).toHaveLength(0);
    expect(updatedProposal.rewards).toHaveLength(1);
    expect(rewardPage?.title).toBe('milestone reward 1');
  });

  it('should make the rewards public if the proposal has the makeRewardsPublic field set to true', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const pageTitle = 'page title 124';

    const proposal = await testUtilsProposals.generateProposal({
      title: pageTitle,
      userId: user.id,
      spaceId: space.id,
      proposalStatus: 'published',
      fields: {
        // This is the important configuration
        makeRewardsPublic: true
      },
      evaluationInputs: [
        {
          id: uuid(),
          index: 0,
          reviewers: [{ group: 'user', id: reviewerUser.id }],
          rubricCriteria: [],
          title: 'Example step',
          evaluationType: 'rubric',
          permissions: []
        }
      ],
      authors: [user.id, extraUser.id]
    });

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
        fields: {
          pendingRewards: [
            {
              draftId: '1',
              reward: {
                chainId: 1,
                rewardAmount: 1337,
                rewardToken: 'ETH',
                reviewers: [{ group: 'user', id: reviewerUser.id }]
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
      }
    });

    const updatedProposal = await createRewardsForProposal({ proposalId: proposal.id, userId: reviewerUser.id });
    const rewardPage = await prisma.page.findFirst({ where: { bountyId: updatedProposal.rewards[0].id } });

    expect((updatedProposal.fields as any)?.pendingRewards).toHaveLength(0);
    expect(updatedProposal.rewards).toHaveLength(1);
    expect(rewardPage?.title).toBe('milestone reward 1');

    const publicPermission = await prisma.pagePermission.findFirstOrThrow({
      where: {
        public: true,
        pageId: rewardPage?.id
      }
    });

    expect(publicPermission).toBeDefined();
  });

  it('Should not allow to create rewards if user is not reviewer', async () => {
    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      title: 'proposal 2',
      evaluationInputs: [],
      userId: user.id,
      spaceId: space.id,
      authors: [user.id, extraUser.id]
    });

    await prisma.proposal.update({
      where: {
        id: proposal.id
      },
      data: {
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
      }
    });

    await expect(createRewardsForProposal({ proposalId: proposal.id, userId: extraUser.id })).rejects.toThrowError();
    await expect(createRewardsForProposal({ proposalId: proposal.id, userId: user.id })).rejects.toThrowError();
  });
});
