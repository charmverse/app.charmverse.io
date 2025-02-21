import type { PagePermission, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { createRewardsForProposal } from '@root/lib/proposals/createRewardsForProposal';
import { v4 as uuid } from 'uuid';

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
          makeRewardsPublic: true,
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

  it('should add a view permission for each reviewer and proposal author', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const reviewerRole = await testUtilsMembers.generateRole({
      createdBy: user.id,
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
          reviewers: [
            { group: 'user', id: reviewerUser.id },
            { group: 'role', id: reviewerRole.id }
          ],
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
                // Currently this is ignored by the implementation, and we base the reviewers on the evaluation reviewers
                reviewers: [
                  { group: 'user', id: reviewerUser.id },
                  { group: 'role', id: reviewerRole.id }
                ]
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

    const permissions = await prisma.pagePermission.findMany({
      where: {
        pageId: rewardPage?.id
      }
    });

    const rewardPageId = rewardPage?.id as string;

    expect(permissions).toHaveLength(5);

    expect(permissions).toEqual(
      expect.arrayContaining<PagePermission>([
        // Author permissions
        {
          allowDiscovery: false,
          id: expect.any(String),
          inheritedFromPermission: null,
          pageId: rewardPageId,
          permissionLevel: 'view',
          public: null,
          permissions: [],
          roleId: null,
          spaceId: null,
          userId: user.id
        },
        {
          allowDiscovery: false,
          id: expect.any(String),
          inheritedFromPermission: null,
          pageId: rewardPageId,
          permissionLevel: 'view',
          public: null,
          permissions: [],
          roleId: null,
          spaceId: null,
          userId: extraUser.id
        },
        // Reviewer permissions
        {
          allowDiscovery: false,
          id: expect.any(String),
          inheritedFromPermission: null,
          pageId: rewardPageId,
          permissionLevel: 'view',
          public: null,
          permissions: [],
          roleId: reviewerRole.id,
          spaceId: null,
          userId: null
        },
        {
          allowDiscovery: false,
          id: expect.any(String),
          inheritedFromPermission: null,
          pageId: rewardPageId,
          permissionLevel: 'view',
          public: null,
          permissions: [],
          roleId: null,
          spaceId: null,
          userId: reviewerUser.id
        },
        // Created by default based on space permissions
        {
          allowDiscovery: false,
          id: expect.any(String),
          inheritedFromPermission: null,
          pageId: rewardPageId,
          permissionLevel: 'view',
          public: null,
          permissions: [],
          roleId: null,
          spaceId: space.id,
          userId: null
        }
      ])
    );
  });
});
