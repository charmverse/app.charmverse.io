import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { CreateProposalInput } from 'lib/proposal/createProposal';
import { emptyDocument } from 'lib/prosemirror/constants';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  space = generated.space;
  user = generated.user;
});

describe('POST /api/proposals - Create a proposal', () => {
  it('should allow a user to create a proposal in a specific category, with page content, reviewers and authors configured and respond with 201', async () => {
    const userCookie = await loginUser(user.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: user.id,
      authors: [user.id, otherUser.id],
      reviewers: [{ group: 'user', id: user.id }],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      }
    };

    const createdProposal = (
      await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(201)
    ).body as { id: string };

    const proposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: createdProposal.id
      },
      include: {
        authors: true,
        reviewers: true
      }
    });
    expect(proposal).toMatchObject<Partial<ProposalWithUsers>>({
      authors: expect.arrayContaining([
        {
          proposalId: createdProposal?.id as string,
          userId: user.id
        },
        {
          proposalId: createdProposal?.id as string,
          userId: otherUser.id
        }
      ]),
      reviewers: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          proposalId: createdProposal?.id as string,
          userId: user.id
        })
      ])
    });
  });

  it('should fail to create a proposal template if the user is not an admin', async () => {
    const userCookie = await loginUser(user.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: user.id,
      authors: [user.id, otherUser.id],
      reviewers: [{ group: 'user', id: user.id }],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal',
        type: 'proposal_template'
      }
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });
});
