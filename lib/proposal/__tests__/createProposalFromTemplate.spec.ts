import type { ProposalCategory, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { InsecureOperationError } from 'lib/utilities/errors';
import { generateUserAndSpaceWithApiToken, generateSpaceUser } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposal } from '../createProposal';
import { createProposalFromTemplate } from '../createProposalFromTemplate';

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

describe('Creates a proposal from a template', () => {
  it('Should create a proposal from a template and copy its reviewers', async () => {
    const reviewerUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    const { page: templatePage, proposal } = await createProposal({
      spaceId: space.id,
      userId: user.id,
      categoryId: proposalCategory.id,
      reviewers: [
        {
          group: 'user',
          id: reviewerUser.id
        }
      ],
      pageProps: {
        contentText: 'This is a document page',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph'
            },
            {
              type: 'paragraph',
              content: [
                {
                  text: 'This is a document page',
                  type: 'text'
                }
              ]
            }
          ]
        }
      }
    });

    const {
      page: resultPage,
      proposal: { id: proposalId }
    } = await createProposalFromTemplate({
      spaceId: space.id,
      createdBy: user.id,
      templateId: proposal.id
    });

    const resultProposal = await prisma.proposal.findUnique({
      where: {
        id: proposalId
      },
      include: {
        authors: true,
        reviewers: true
      }
    });

    expect(resultPage.type).toBe('proposal');
    expect(resultPage.content?.toString()).toEqual(templatePage.content?.toString());
    expect(resultProposal?.authors.length).toEqual(1);
    expect(resultProposal?.authors[0].userId).toEqual(user.id);
    expect(resultProposal?.reviewers.length).toEqual(1);
    expect(resultProposal?.reviewers[0].userId).toEqual(reviewerUser.id);
  });

  it('should throw an error if trying to use a proposal template from a different space', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken();
    const otherSpaceProposalCategory = await generateProposalCategory({
      spaceId: otherSpace.id
    });

    const { proposal: proposalTemplate } = await createProposal({
      spaceId: otherSpace.id,
      userId: otherUser.id,
      categoryId: otherSpaceProposalCategory.id
    });

    await expect(
      createProposalFromTemplate({
        spaceId: space.id,
        createdBy: user.id,
        templateId: proposalTemplate.id
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);
  });
});
