import type {
  GoogleAccount,
  Page,
  Proposal,
  Role,
  Space,
  SuperApiToken,
  User,
  UserWallet
} from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 } from 'uuid';

import type { PublicApiProposal } from 'pages/api/v1/proposals';

type ProposalWithDetails = Proposal & {
  page: Page;
};

type UserWithDetails = User & {
  wallets: UserWallet[];
  googleAccounts: GoogleAccount[];
};

let proposal: ProposalWithDetails & { evaluations: { id: string }[] };
let draftProposal: ProposalWithDetails;
let privateDraftProposal: ProposalWithDetails;
let proposalAuthor: UserWithDetails;
let proposalReviewer: UserWithDetails;
let reviewerRole: Role;
let space: Space;

let superApiKey: SuperApiToken;

const proposalText = `This is an improvement idea`;

const voteOptions = ['Yes', 'No', 'Abstain'];

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
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
          email: `test-email-${v4()}@test.com`,
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
          email: `test-email-${v4()}@test.com`,
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
  proposal = (await prisma.proposal.create({
    data: {
      createdBy: proposalAuthor.id,
      status: 'published',
      space: { connect: { id: space.id } },
      page: {
        create: {
          title: 'Active proposal',
          author: { connect: { id: proposalAuthor.id } },
          space: { connect: { id: space.id } },
          path: `proposal-${v4()}`,
          type: 'proposal',
          updatedBy: proposalAuthor.id,
          contentText: proposalText,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    text: proposalText,
                    type: 'text'
                  }
                ]
              }
            ]
          }
        }
      },
      authors: {
        create: {
          author: { connect: { id: proposalAuthor.id } }
        }
      },
      evaluations: {
        create: {
          type: 'pass_fail',
          index: 0,
          title: 'pass/fail'
        }
      }
    },
    include: {
      page: true,
      evaluations: true
    }
  })) as ProposalWithDetails & { evaluations: { id: string }[] };

  await prisma.proposalReviewer.createMany({
    data: [
      {
        evaluationId: proposal.evaluations[0].id,
        proposalId: proposal.id,
        userId: proposalReviewer.id
      },
      {
        evaluationId: proposal.evaluations[0].id,
        proposalId: proposal.id,
        roleId: reviewerRole.id
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

  draftProposal = (await prisma.proposal.create({
    data: {
      createdBy: proposalAuthor.id,
      status: 'draft',
      space: { connect: { id: space.id } },
      page: {
        create: {
          title: 'Draft proposal',
          author: { connect: { id: proposalAuthor.id } },
          space: { connect: { id: space.id } },
          path: `proposal-${v4()}`,
          type: 'proposal',
          updatedBy: proposalAuthor.id,
          contentText: proposalText,
          content: {
            type: 'doc',
            content: [
              {
                type: 'heading',
                attrs: {
                  level: 2
                },
                text: proposalText
                // content: [
                //   {
                //     text: proposalText,
                //     type: 'text'
                //   }
                // ]
              }
            ]
          }
        }
      },
      authors: {
        create: {
          author: { connect: { id: proposalAuthor.id } }
        }
      }
    },
    include: {
      page: true
    }
  })) as ProposalWithDetails;
  privateDraftProposal = (await prisma.proposal.create({
    data: {
      createdBy: proposalAuthor.id,
      status: 'draft',
      space: { connect: { id: space.id } },
      page: {
        create: {
          title: 'Draft proposal',
          author: { connect: { id: proposalAuthor.id } },
          space: { connect: { id: space.id } },
          path: `proposal-${v4()}`,
          type: 'proposal',
          updatedBy: proposalAuthor.id,
          contentText: proposalText
        }
      },
      authors: {
        create: {
          author: { connect: { id: proposalAuthor.id } }
        }
      }
    },
    include: {
      page: true
    }
  })) as ProposalWithDetails;

  superApiKey = await prisma.superApiToken.create({
    data: {
      token: v4(),
      name: `test-super-api-key-${v4()}`,
      spaces: { connect: { id: space.id } }
    }
  });
});

describe('GET /api/v1/proposals', () => {
  // This test needs to be fixed.
  it('should return a list of proposals (except draft and private draft), along with vote options if they exist, in the space when called with an API key', async () => {
    const normalApiToken = await prisma.spaceApiToken.create({
      data: {
        token: v4(),
        space: { connect: { id: space.id } }
      }
    });

    const response = (
      await request(baseUrl).get(`/api/v1/proposals?api_key=${normalApiToken.token}`).send().expect(200)
    ).body as PublicApiProposal[];

    // Both proposals should have been returned
    expect(response.length).toEqual(1);

    const activeProposal = response[0] as PublicApiProposal;

    expect(activeProposal).toEqual<PublicApiProposal>(
      expect.objectContaining<PublicApiProposal>({
        createdAt: proposal.page.createdAt.toISOString() as any,
        content: {
          text: proposalText,
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
          title: 'pass/fail',
          type: 'pass_fail',
          result: 'in_progress'
        },
        title: proposal.page.title,
        status: proposal.status,
        url: `${baseUrl}/${space?.domain}/${proposal.page?.path}`,
        voteOptions
      })
    );
  });

  it('should return a list of proposals (except draft and private draft) in the space when called with a super API key', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals?spaceId=${space.id}`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send()
        .expect(200)
    ).body as PublicApiProposal[];

    // Both proposals should have been returned
    expect(response.length).toEqual(1);

    const activeProposal = response[0] as PublicApiProposal;

    expect(activeProposal).toEqual<PublicApiProposal>(
      expect.objectContaining<PublicApiProposal>({
        createdAt: proposal.page.createdAt.toISOString() as any,
        content: {
          text: proposalText,
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
        currentStep: {
          startedAt: proposal.page.createdAt.toISOString(),
          title: 'pass/fail',
          type: 'pass_fail',
          result: 'in_progress'
        },
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
        status: proposal.status,
        url: `${baseUrl}/${space?.domain}/${proposal.page?.path}`
      })
    );
  });

  it('should ignore proposals whose page has been soft deleted', async () => {
    const { space: space2, user: space2User } = await generateUserAndSpace();

    const space2SuperApiToken = await prisma.superApiToken.create({
      data: {
        name: `Test super API key for space ${space2.id}`,
        token: v4(),
        spaces: { connect: { id: space2.id } }
      }
    });

    const deletedProposal = await prisma.proposal.create({
      data: {
        createdBy: space2User.id,
        status: 'published',
        space: { connect: { id: space2.id } },
        page: {
          create: {
            // This is the important part
            deletedAt: new Date(),
            title: 'Proposal marked as deleted',
            author: { connect: { id: space2User.id } },
            space: { connect: { id: space2.id } },
            path: `proposal-${v4()}`,
            type: 'proposal',
            updatedBy: space2User.id,
            contentText: proposalText
          }
        }
      }
    });

    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals?spaceId=${space2.id}`)
        .set({ authorization: `Bearer ${space2SuperApiToken.token}` })
        .send()
        .expect(200)
    ).body as PublicApiProposal[];

    // No data should be returned
    expect(response.length).toEqual(0);
  });

  it('should fail if the requester super API key is not linked to this space', async () => {
    const otherSuperApiKey = await prisma.superApiToken.create({
      data: {
        token: v4(),
        name: `test-super-api-key-${v4()}`
      }
    });

    await request(baseUrl)
      .get(`/api/v1/proposals?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${otherSuperApiKey.token}` })
      .send()
      .expect(401);
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
        .get(`/api/v1/proposals?spaceId=${secondSpace.id}`)
        .set({ authorization: `Bearer ${otherSuperApiKey.token}` })
        .send()
        .expect(200)
    ).body;

    expect(response.length).toEqual(1);
    expect(response[0].id).toBe(secondSpaceProposal.id);
  });
});
