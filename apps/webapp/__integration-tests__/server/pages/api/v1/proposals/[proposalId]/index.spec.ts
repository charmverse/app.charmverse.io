import type { GoogleAccount, Page, Role, Space, SuperApiToken, User, UserWallet } from '@charmverse/core/prisma';
import type { SpaceApiToken } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateSpaceApiKey, generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { PublicApiProposal } from 'pages/api/v1/proposals';

type UserWithDetails = User & {
  wallets: UserWallet[];
  googleAccounts: GoogleAccount[];
};

let proposal: Awaited<ReturnType<typeof testUtilsProposals.generateProposal>>;
let proposalAuthor: UserWithDetails;
let proposalReviewer: UserWithDetails;
let reviewerRole: Role;
let space: Space;

let apiKey: SpaceApiToken;
let superApiKey: SuperApiToken;

const proposalText = `This is an improvement idea`;

const commentText = 'This is a comment';
const childCommentTtext = 'This is a child comment';

const voteOptions = ['Yes', 'No', 'Abstain'];

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;

  apiKey = await generateSpaceApiKey({ spaceId: space.id });
  superApiKey = await generateSuperApiKey({ spaceId: space.id });

  reviewerRole = await generateRole({
    createdBy: generated.user.id,
    spaceId: space.id
  });
  const firstUser = generated.user;
  proposalAuthor = await prisma.user.update({
    where: {
      id: firstUser.id
    },
    data: {
      wallets: {
        create: {
          address: randomETHWalletAddress(),
          ensname: `test.eth-${firstUser.id}`
        }
      },
      googleAccounts: {
        create: {
          email: `test-email-${uuid()}@test.com`,
          avatarUrl: 'https://test.com/avatar.png',
          name: 'Author'
        }
      }
    },
    include: {
      wallets: true,
      googleAccounts: true
    }
  });
  const secondUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  proposalReviewer = await prisma.user.update({
    where: {
      id: secondUser.id
    },
    data: {
      wallets: {
        create: {
          address: randomETHWalletAddress()
        }
      },
      googleAccounts: {
        create: {
          email: `test-email-${uuid()}@test.com`,
          avatarUrl: 'https://test.com/avatar.png',
          name: 'Reviewer'
        }
      }
    },
    include: {
      wallets: true,
      googleAccounts: true
    }
  });
  proposal = await testUtilsProposals.generateProposal({
    spaceId: space.id,
    userId: proposalAuthor.id,
    proposalStatus: 'draft',
    content: stubProsemirrorDoc({
      text: proposalText
    }),
    authors: [proposalAuthor.id],
    evaluationInputs: [
      {
        evaluationType: 'pass_fail',
        permissions: [],
        reviewers: [
          { group: 'role', id: reviewerRole.id },
          { group: 'user', id: proposalReviewer.id }
        ]
      }
    ]
  });

  await prisma.vote.create({
    data: {
      deadline: new Date(),
      status: 'InProgress',
      threshold: 20,
      title: 'Test Vote',
      context: 'proposal',
      page: { connect: { id: proposal.page.id } },
      author: { connect: { id: proposalAuthor.id } },
      space: { connect: { id: space.id } },
      voteOptions: {
        createMany: {
          data: voteOptions.map((opt) => ({ name: opt }))
        }
      }
    }
  });
});

describe('GET /api/v1/proposals/{proposalId}', () => {
  it('should return a proposal when called with an API key as well as vote options if they exist', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}`)
        .set({
          authorization: `Bearer ${apiKey.token}`
        })
        .expect(200)
    ).body as PublicApiProposal;

    expect(response).toMatchObject<PublicApiProposal>(
      expect.objectContaining<PublicApiProposal>({
        createdAt: proposal.page.createdAt.toISOString() as any,
        content: {
          text: expect.any(String),
          markdown: proposalText
        },
        id: proposal.id,
        authors: [
          {
            userId: proposalAuthor.id,
            address: proposalAuthor.wallets[0].address,
            email: proposalAuthor.googleAccounts[0].email
          }
        ],
        reviewers: expect.arrayContaining([
          {
            type: 'role',
            id: reviewerRole.id
          },
          {
            type: 'user',
            id: proposalReviewer.id
          }
        ]),
        title: proposal.page.title,
        currentStep: {
          startedAt: proposal.page.createdAt.toISOString(),
          result: 'in_progress',
          title: 'pass_fail',
          type: 'pass_fail'
        },
        status: proposal.status,
        url: `${baseUrl}/${space?.domain}/${proposal.page?.path}`,
        voteOptions: expect.arrayContaining(voteOptions)
      })
    );
  });

  it('should return a proposal when called with a super API key', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}?spaceId=${space.id}`)
        .set({
          authorization: `Bearer ${superApiKey.token}`
        })
        .expect(200)
    ).body as PublicApiProposal;

    expect(response).toEqual<PublicApiProposal>(
      expect.objectContaining<PublicApiProposal>({
        createdAt: proposal.page.createdAt.toISOString() as any,
        content: {
          text: expect.any(String),
          markdown: proposalText
        },
        id: proposal.id,
        authors: [
          {
            userId: proposalAuthor.id,
            address: proposalAuthor.wallets[0].address,
            email: proposalAuthor.googleAccounts[0].email
          }
        ],
        reviewers: expect.arrayContaining([
          {
            type: 'role',
            id: reviewerRole.id
          },
          {
            type: 'user',
            id: proposalReviewer.id
          }
        ]),
        currentStep: {
          startedAt: proposal.page.createdAt.toISOString(),
          result: 'in_progress',
          title: 'pass_fail',
          type: 'pass_fail'
        },
        title: proposal.page.title,
        status: proposal.status,
        url: `${baseUrl}/${space?.domain}/${proposal.page?.path}`
      })
    );
  });

  it('should not fail if an author has no google accounts or verified emails in their account', async () => {
    const { space: secondSpace, user: secondSpaceUser } = await testUtilsUser.generateUserAndSpace();

    const secondSpaceProposal = await testUtilsProposals.generateProposal({
      spaceId: secondSpace.id,
      userId: secondSpaceUser.id,
      authors: [secondSpaceUser.id],
      proposalStatus: 'published'
    });

    const otherSuperApiKey = await generateSuperApiKey({ spaceId: secondSpace.id });

    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${secondSpaceProposal.id}?spaceId=${secondSpace.id}`)
        .set({ authorization: `Bearer ${otherSuperApiKey.token}` })
        .send()
        .expect(200)
    ).body;

    expect(response.id).toEqual(secondSpaceProposal.id);
  });

  it('should fail if the requester api key is not linked to this space', async () => {
    const otherSpace = await testUtilsUser.generateUserAndSpace();
    const otherSpaceApiKey = await generateSpaceApiKey({
      spaceId: otherSpace.space.id
    });
    const otherSpaceSuperApiKey = await generateSuperApiKey({
      spaceId: otherSpace.space.id
    });

    // Space API key used, don't disclose resource exists
    await request(baseUrl)
      .get(`/api/v1/proposals/${proposal.id}`)
      .set({ authorization: `Bearer ${otherSpaceApiKey.token}` })
      .expect(404);
    // Space ID provided not included in authorized space IDs for super API key
    await request(baseUrl)
      .get(`/api/v1/proposals/${proposal.id}?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${otherSpaceSuperApiKey.token}` })
      .expect(401);
  });
});
