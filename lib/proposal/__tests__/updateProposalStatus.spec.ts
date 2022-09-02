import { Space, User } from '@prisma/client';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { InvalidStateError } from 'lib/middleware';
import { updateProposalStatus } from '../updateProposalStatus';
import { createProposal } from '../createProposal';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('Updates the proposal of a page', () => {
  it('Move a private draft proposal to draft status', async () => {
    const pageWithProposal = await createProposal({
      pageCreateInput: {
        author: {
          connect: {
            id: user.id
          }
        },
        contentText: '',
        path: 'path',
        space: {
          connect: {
            id: space.id
          }
        },
        title: 'page-title',
        type: 'proposal',
        updatedBy: user.id
      },
      spaceId: space.id,
      userId: user.id
    });
    const updatedProposal = await updateProposalStatus({
      currentStatus: 'private_draft',
      newStatus: 'draft',
      proposalId: pageWithProposal.proposalId as string
    });
    expect(updatedProposal.status).toBe('draft');
  });

  it('Throw error when trying to move a draft proposal to review', async () => {
    const pageWithProposal = await createProposal({
      pageCreateInput: {
        author: {
          connect: {
            id: user.id
          }
        },
        contentText: '',
        path: 'path',
        space: {
          connect: {
            id: space.id
          }
        },
        title: 'page-title',
        type: 'proposal',
        updatedBy: user.id
      },
      spaceId: space.id,
      userId: user.id
    });
    await expect(updateProposalStatus({
      currentStatus: 'private_draft',
      newStatus: 'review',
      proposalId: pageWithProposal.proposalId as string
    })).rejects.toBeInstanceOf(InvalidStateError);
  });
});
