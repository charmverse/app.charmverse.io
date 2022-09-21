import type { Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';
import { createProposal } from '../createProposal';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('Creates a page and proposal with relevant configuration', () => {
  it('Create a page and returns it with the attached proposal', async () => {
    const { page, workspaceEvent } = await createProposal({
      contentText: '',
      path: 'path',
      title: 'page-title',
      createdBy: user.id,
      spaceId: space.id
    });

    expect(page).toMatchObject(expect.objectContaining({
      title: 'page-title',
      type: 'proposal'
    }));

    const proposal = await prisma.proposal.findUnique({
      where: {
        id: page.proposalId as string
      },
      include: {
        authors: true
      }
    });

    expect(proposal).toMatchObject(expect.objectContaining({
      authors: [{
        proposalId: proposal?.id,
        userId: user.id
      }]
    }));

    expect(workspaceEvent).toMatchObject(expect.objectContaining({
      type: 'proposal_create'
    }));
  });
});
