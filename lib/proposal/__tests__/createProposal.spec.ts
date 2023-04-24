import { prisma } from '@charmverse/core';
import type { ProposalCategory, Space, User } from '@charmverse/core/dist/prisma';

import { InvalidInputError } from 'lib/utilities/errors';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposal } from '../createProposal';
import type { ProposalWithUsers } from '../interface';

let user: User;
let space: Space;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
});

describe('Creates a page and proposal with relevant configuration', () => {
  it('Create a page and proposal', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });
    const { page, workspaceEvent, proposal } = await createProposal({
      pageProps: {
        contentText: '',
        title: 'page-title'
      },
      categoryId: proposalCategory.id,
      userId: user.id,
      spaceId: space.id,
      reviewers: [
        {
          group: 'user',
          id: reviewerUser.id
        }
      ]
    });

    expect(page).toMatchObject(
      expect.objectContaining({
        title: 'page-title',
        type: 'proposal'
      })
    );

    expect(proposal).toMatchObject(
      expect.objectContaining<Partial<ProposalWithUsers>>({
        authors: [
          {
            proposalId: proposal?.id,
            userId: user.id
          }
        ],
        reviewers: [
          {
            id: expect.any(String),
            proposalId: proposal?.id as string,
            userId: reviewerUser.id,
            roleId: null
          }
        ]
      })
    );

    expect(workspaceEvent).toMatchObject(
      expect.objectContaining({
        type: 'proposal_status_change'
      })
    );
  });

  it('should throw an error if the category is not specified', async () => {
    await expect(
      createProposal({
        pageProps: {
          contentText: '',
          title: 'page-title'
        },
        categoryId: null as any,
        userId: user.id,
        spaceId: space.id
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
