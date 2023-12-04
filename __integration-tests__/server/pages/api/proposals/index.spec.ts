import type { Space, User } from '@charmverse/core/prisma';
import type { ProposalCategory } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { CreateProposalInput, CreatedProposal } from 'lib/proposal/createProposal';
import { emptyDocument } from 'lib/prosemirror/constants';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let space: Space;
let user: User;
let proposalCategory: ProposalCategory;
let readonlyProposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  space = generated.space;
  user = generated.user;
  proposalCategory = await testUtilsProposals.generateProposalCategory({
    spaceId: space.id,
    proposalCategoryPermissions: [
      {
        permissionLevel: 'full_access',
        assignee: { group: 'space', id: space.id }
      }
    ]
  });
  readonlyProposalCategory = await testUtilsProposals.generateProposalCategory({
    spaceId: space.id
  });
});

describe('POST /api/proposals - Create a proposal', () => {
  it('should allow a user to create a proposal in a specific category, with page content, reviewers and authors configured and respond with 201', async () => {
    const userCookie = await loginUser(user.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      categoryId: proposalCategory.id,
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
    ).body as CreatedProposal;

    expect(createdProposal.proposal).toMatchObject<Partial<ProposalWithUsers>>({
      authors: expect.arrayContaining([
        {
          proposalId: createdProposal?.proposal.id as string,
          userId: user.id
        },
        {
          proposalId: createdProposal?.proposal.id as string,
          userId: otherUser.id
        }
      ]),
      reviewers: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          proposalId: createdProposal?.proposal.id as string,
          userId: user.id
        })
      ])
    });
  });

  it('should fail to create a proposal if the user does not have permissions for the category and respond with 401', async () => {
    const userCookie = await loginUser(user.id);

    const input: CreateProposalInput = {
      // This is the important bit
      categoryId: readonlyProposalCategory.id,
      spaceId: space.id,
      userId: user.id,
      authors: [user.id],
      reviewers: [{ group: 'user', id: user.id }],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      }
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });

  it('should fail to create a proposal template if the user is not an admin', async () => {
    const userCookie = await loginUser(user.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      categoryId: proposalCategory.id,
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
