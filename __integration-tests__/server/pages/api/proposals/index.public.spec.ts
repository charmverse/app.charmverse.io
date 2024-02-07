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
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
  space = generated.space;
  user = generated.user;
});

describe('POST /api/proposals - Create a proposal', () => {
  it('should allow a space member to create a proposal with page content, reviewers and authors configured and respond with 201', async () => {
    const userCookie = await loginUser(user.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: user.id,
      authors: [user.id, otherUser.id],
      evaluations: [],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      }
    };

    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(201);
  });

  it('should not allow a user outside the space to create a proposal and respond with 401', async () => {
    const { user: outsideUser } = await testUtilsUser.generateUserAndSpace();

    const userCookie = await loginUser(outsideUser.id);

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: user.id,
      authors: [user.id],
      evaluations: [],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      }
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });
});
