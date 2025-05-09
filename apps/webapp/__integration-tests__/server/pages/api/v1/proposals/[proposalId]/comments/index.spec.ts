import type { Page, Space, SuperApiToken, User } from '@charmverse/core/prisma';
import type { PageComment, Prisma, Proposal, SpaceApiToken } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateSpaceApiKey, generateSuperApiKey } from '@packages/testing/generators/apiKeys';
import { baseUrl } from '@packages/testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { stubProsemirrorDoc } from '@packages/testing/stubs/pageContent';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { PublicApiProposal } from 'pages/api/v1/proposals';
import type { PublicApiProposalComment } from 'pages/api/v1/proposals/[proposalId]/comments';

function generateVoteCreationStubs({
  downvotes,
  upvotes,
  commenters
}: {
  upvotes: number;
  downvotes: number;
  commenters: User[];
}): Prisma.PageCommentVoteCreateManyCommentInputEnvelope {
  if (downvotes + upvotes > commenters.length) {
    throw new Error('Too many votes. Add enough users to the space');
  }

  const inputs: Prisma.PageCommentVoteCreateManyCommentInput[] = [];

  for (let i = 0; i < upvotes; i++) {
    inputs.push({
      createdBy: commenters[i].id,
      upvoted: true
    });
  }
  for (let i = 0; i < downvotes; i++) {
    inputs.push({
      // Offset voter index by the number of upvotes to ensure we don't try to create duplicate votes from a user for the same comment
      createdBy: commenters[i + upvotes].id,
      upvoted: false
    });
  }

  return {
    data: inputs
  };
}
describe('GET /api/v1/proposals/{proposalId}/comments', () => {
  let proposal: Awaited<ReturnType<typeof testUtilsProposals.generateProposal>>;
  let proposalAuthor: User;
  let proposalReviewer: User;
  let space: Space;

  let apiKey: SpaceApiToken;
  let superApiKey: SuperApiToken;

  const proposalText = `This is an improvement idea`;

  const commentText = 'This is a comment';
  const childCommentText = 'This is a child comment';
  const nestedCommentText = 'This is the nested comment';

  // 2 root comments
  let rootComments: PageComment[];
  // 2 child comments under 1 root comment
  let childComments: PageComment[];
  // 1 nested comment
  let nestedChildComments: PageComment[];

  const commenters: User[] = [];

  const root1Upvotes = 5;
  const root1Downvotes = 2;
  const root2Upvotes = 8;
  const root2Downvotes = 1;
  const child1Upvotes = 7;
  const child1Downvotes = 1;
  const child2Upvotes = 4;
  const child2Downvotes = 3;
  const nestedUpvotes = 3;
  const nestedDownvotes = 8;
  beforeAll(async () => {
    const generated = await generateUserAndSpace();
    space = generated.space;

    // We need a unique user for each upvote/downvote
    for (let i = 0; i < 12; i++) {
      const commenterUser = await testUtilsUser.generateSpaceUser({
        spaceId: space.id,
        isAdmin: false
      });
      commenters.push(commenterUser);
    }

    apiKey = await generateSpaceApiKey({ spaceId: space.id });
    superApiKey = await generateSuperApiKey({ spaceId: space.id });

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
      reviewers: [{ group: 'user', id: proposalReviewer.id }]
    });

    rootComments = await Promise.all([
      prisma.pageComment.create({
        data: {
          createdBy: commenters[0].id,
          pageId: proposal.id,
          parentId: null,
          contentText: commentText,
          content: stubProsemirrorDoc({
            text: commentText
          }),
          votes: {
            createMany: generateVoteCreationStubs({
              upvotes: root1Upvotes,
              downvotes: root1Downvotes,
              commenters
            })
          }
        }
      }),
      prisma.pageComment.create({
        data: {
          createdBy: commenters[1].id,
          pageId: proposal.id,
          parentId: null,
          contentText: commentText,
          content: stubProsemirrorDoc({
            text: commentText
          }),
          votes: {
            createMany: generateVoteCreationStubs({
              upvotes: root2Upvotes,
              downvotes: root2Downvotes,
              commenters
            })
          }
        }
      })
    ]);

    childComments = await Promise.all([
      prisma.pageComment.create({
        data: {
          createdBy: commenters[2].id,
          pageId: proposal.id,
          parentId: rootComments[0].id,
          contentText: childCommentText,
          content: stubProsemirrorDoc({
            text: childCommentText
          }),
          votes: {
            createMany: generateVoteCreationStubs({
              upvotes: child1Upvotes,
              downvotes: child1Downvotes,
              commenters
            })
          }
        }
      }),
      prisma.pageComment.create({
        data: {
          createdBy: commenters[3].id,
          pageId: proposal.id,
          parentId: rootComments[0].id,
          contentText: childCommentText,
          content: stubProsemirrorDoc({
            text: childCommentText
          }),
          votes: {
            createMany: generateVoteCreationStubs({
              upvotes: child2Upvotes,
              downvotes: child2Downvotes,
              commenters
            })
          }
        }
      })
    ]);

    nestedChildComments = await Promise.all([
      prisma.pageComment.create({
        data: {
          createdBy: commenters[4].id,
          pageId: proposal.id,
          parentId: childComments[0].id,
          contentText: nestedCommentText,
          content: stubProsemirrorDoc({
            text: nestedCommentText
          }),
          votes: {
            createMany: generateVoteCreationStubs({
              upvotes: nestedUpvotes,
              downvotes: nestedDownvotes,
              commenters
            })
          }
        }
      })
    ]);
  });

  it('should return the list of all comments when called with an API key', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}/comments`)
        .set({
          authorization: `Bearer ${apiKey.token}`
        })
        .expect(200)
    ).body as PublicApiProposalComment[];

    const expectedResult: PublicApiProposalComment[] = [
      {
        id: rootComments[0].id,
        createdAt: rootComments[0].createdAt.toISOString(),
        content: {
          markdown: commentText,
          text: commentText
        },
        children: [],
        createdBy: commenters[0].id,
        upvotes: root1Upvotes,
        downvotes: root1Downvotes,
        parentId: null
      },
      {
        id: rootComments[1].id,
        createdAt: rootComments[1].createdAt.toISOString(),
        content: {
          markdown: commentText,
          text: commentText
        },
        children: [],
        createdBy: commenters[1].id,
        upvotes: root2Upvotes,
        downvotes: root2Downvotes,
        parentId: null
      },
      {
        id: childComments[0].id,
        createdAt: childComments[0].createdAt.toISOString(),
        content: {
          markdown: childCommentText,
          text: childCommentText
        },
        children: [],
        createdBy: commenters[2].id,
        upvotes: child1Upvotes,
        downvotes: child1Downvotes,
        parentId: rootComments[0].id
      },
      {
        id: childComments[1].id,
        createdAt: childComments[1].createdAt.toISOString(),
        content: {
          markdown: childCommentText,
          text: childCommentText
        },
        children: [],
        createdBy: commenters[3].id,
        upvotes: child2Upvotes,
        downvotes: child2Downvotes,
        parentId: rootComments[0].id
      },
      {
        id: nestedChildComments[0].id,
        createdAt: nestedChildComments[0].createdAt.toISOString(),
        content: {
          markdown: nestedCommentText,
          text: nestedCommentText
        },
        children: [],
        createdBy: commenters[4].id,
        upvotes: nestedUpvotes,
        downvotes: nestedDownvotes,
        parentId: childComments[0].id
      }
    ];

    expect(response).toHaveLength(rootComments.length + childComments.length + nestedChildComments.length);

    expect(response).toMatchObject(expect.arrayContaining<PublicApiProposalComment>(expectedResult));
  });

  it('should return the comments as a tree if this option is used', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}/comments?resultsAsTree=true`)
        .set({
          authorization: `Bearer ${apiKey.token}`
        })
        .expect(200)
    ).body as PublicApiProposalComment[];

    const expectedTree: PublicApiProposalComment[] = [
      {
        id: rootComments[0].id,
        createdAt: rootComments[0].createdAt.toISOString(),
        content: {
          markdown: commentText,
          text: commentText
        },
        createdBy: commenters[0].id,
        upvotes: root1Upvotes,
        downvotes: root1Downvotes,
        parentId: null,
        children: expect.arrayContaining<PublicApiProposalComment>([
          {
            id: childComments[0].id,
            createdAt: childComments[0].createdAt.toISOString(),
            content: {
              markdown: childCommentText,
              text: childCommentText
            },
            children: [
              {
                id: nestedChildComments[0].id,
                createdAt: nestedChildComments[0].createdAt.toISOString(),
                content: {
                  markdown: nestedCommentText,
                  text: nestedCommentText
                },
                children: [],
                createdBy: commenters[4].id,
                upvotes: nestedUpvotes,
                downvotes: nestedDownvotes,
                parentId: childComments[0].id
              }
            ],
            createdBy: commenters[2].id,
            upvotes: child1Upvotes,
            downvotes: child1Downvotes,
            parentId: rootComments[0].id
          },
          {
            id: childComments[1].id,
            createdAt: childComments[1].createdAt.toISOString(),
            content: {
              markdown: childCommentText,
              text: childCommentText
            },
            children: [],
            createdBy: commenters[3].id,
            upvotes: child2Upvotes,
            downvotes: child2Downvotes,
            parentId: rootComments[0].id
          }
        ])
      },
      {
        id: rootComments[1].id,
        createdAt: rootComments[1].createdAt.toISOString(),
        content: {
          markdown: commentText,
          text: commentText
        },
        children: [],
        createdBy: commenters[1].id,
        upvotes: root2Upvotes,
        downvotes: root2Downvotes,
        parentId: null
      }
    ];

    // Only the roots should be at the top level
    expect(response).toHaveLength(rootComments.length);
    expect(response).toEqual(expect.arrayContaining<PublicApiProposalComment>(expectedTree));
  });

  it('should return the list of all comments when called with a super API key', async () => {
    const response = (
      await request(baseUrl)
        .get(`/api/v1/proposals/${proposal.id}/comments?spaceId=${space.id}`)
        .set({
          authorization: `Bearer ${superApiKey.token}`
        })
        .expect(200)
    ).body as PublicApiProposal[];

    const expectedResult: PublicApiProposalComment[] = [
      {
        id: rootComments[0].id,
        createdAt: rootComments[0].createdAt.toISOString(),
        content: {
          markdown: commentText,
          text: commentText
        },
        children: [],
        createdBy: commenters[0].id,
        upvotes: root1Upvotes,
        downvotes: root1Downvotes,
        parentId: null
      },
      {
        id: rootComments[1].id,
        createdAt: rootComments[1].createdAt.toISOString(),
        content: {
          markdown: commentText,
          text: commentText
        },
        children: [],
        createdBy: commenters[1].id,
        upvotes: root2Upvotes,
        downvotes: root2Downvotes,
        parentId: null
      },
      {
        id: childComments[0].id,
        createdAt: childComments[0].createdAt.toISOString(),
        content: {
          markdown: childCommentText,
          text: childCommentText
        },
        children: [],
        createdBy: commenters[2].id,
        upvotes: child1Upvotes,
        downvotes: child1Downvotes,
        parentId: rootComments[0].id
      },
      {
        id: childComments[1].id,
        createdAt: childComments[1].createdAt.toISOString(),
        content: {
          markdown: childCommentText,
          text: childCommentText
        },
        children: [],
        createdBy: commenters[3].id,
        upvotes: child2Upvotes,
        downvotes: child2Downvotes,
        parentId: rootComments[0].id
      },
      {
        id: nestedChildComments[0].id,
        createdAt: nestedChildComments[0].createdAt.toISOString(),
        content: {
          markdown: nestedCommentText,
          text: nestedCommentText
        },
        children: [],
        createdBy: commenters[4].id,
        upvotes: nestedUpvotes,
        downvotes: nestedDownvotes,
        parentId: childComments[0].id
      }
    ];
    expect(response).toMatchObject(expect.arrayContaining<PublicApiProposalComment>(expectedResult));
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
      .get(`/api/v1/proposals/${proposal.id}/comments`)
      .set({ authorization: `Bearer ${otherSpaceApiKey.token}` })
      .expect(404);
    // Space ID provided not included in authorized space IDs for super API key
    await request(baseUrl)
      .get(`/api/v1/proposals/${proposal.id}/comments?spaceId=${space.id}`)
      .set({ authorization: `Bearer ${otherSpaceSuperApiKey.token}` })
      .expect(401);
  });
});

describe('POST /api/v1/proposals/{proposalId}/comments', () => {
  let space: Space;
  let user: User;
  let proposal: Proposal;
  let spaceApiKey: SpaceApiToken;
  let superApiKey: SuperApiToken;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace();
    space = generated.space;
    user = generated.user;
    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id
    });
    spaceApiKey = await generateSpaceApiKey({
      spaceId: space.id
    });
    superApiKey = await generateSuperApiKey({
      spaceId: space.id
    });
  });

  it('should fail to create a comment when called with a spaceAPI key', async () => {
    await request(baseUrl)
      .post(`/api/v1/proposals/${proposal.id}/comments`)
      .set({ authorization: `Bearer ${spaceApiKey.token}` })
      .send({ userId: user.id, contentMarkdown: 'Comment' })
      .expect(401);
  });

  it('should create a comment when called with a superAPI key', async () => {
    const contentText = 'Example';

    const comment = (
      await request(baseUrl)
        .post(`/api/v1/proposals/${proposal.id}/comments`)
        .set({ authorization: `Bearer ${superApiKey.token}` })
        .send({ userId: user.id, contentMarkdown: contentText })
        .expect(201)
    ).body;

    expect(comment).toMatchObject<PublicApiProposalComment>({
      id: expect.any(String),
      parentId: null,
      createdAt: expect.any(String),
      createdBy: user.id,
      upvotes: 0,
      downvotes: 0,
      content: {
        markdown: contentText,
        text: contentText
      },
      children: []
    });
  });

  it('should fail to create a comment for a proposal in a different space', async () => {
    const { user: otherSpaceUser, space: otherSpace } = await testUtilsUser.generateUserAndSpace();

    const otherSpaceProposal = await testUtilsProposals.generateProposal({
      spaceId: otherSpace.id,
      userId: otherSpaceUser.id
    });

    await request(baseUrl)
      .post(`/api/v1/proposals/${otherSpaceProposal.id}/comments`)
      .set({ authorization: `Bearer ${superApiKey.token}` })
      .send({ userId: user.id, contentMarkdown: 'Example' })
      .expect(404);
  });
});
