import type { ProposalCategory, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposalCategory } from 'testing/utils/proposals';

import { createProposal } from '../createProposal';

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
    const { page, workspaceEvent } = await createProposal({
      pageProps: {
        contentText: '',
        title: 'page-title'
      },
      categoryId: proposalCategory.id,
      userId: user.id,
      spaceId: space.id
    });

    expect(page).toMatchObject(
      expect.objectContaining({
        title: 'page-title',
        type: 'proposal'
      })
    );

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: page.proposalId as string
      },
      include: {
        authors: true
      }
    });

    expect(proposal).toMatchObject(
      expect.objectContaining({
        authors: [
          {
            proposalId: proposal?.id,
            userId: user.id
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
});
