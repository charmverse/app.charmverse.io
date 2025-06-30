import type { Vote } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function generateVote({
  userVotes = [],
  voteOptions = [],
  spaceId,
  createdBy,
  pageId,
  postId,
  deadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  status = 'InProgress',
  title = 'Vote Title',
  context = 'inline',
  description = null
}: Partial<Vote> &
  Pick<Vote, 'spaceId' | 'createdBy'> & {
    pageId?: string | null;
    postId?: string | null;
    voteOptions?: string[];
    userVotes?: string[];
  }) {
  return prisma.vote.create({
    data: {
      deadline,
      status,
      threshold: 50,
      title,
      context,
      author: {
        connect: {
          id: createdBy
        }
      },
      page: pageId
        ? {
            connect: {
              id: pageId
            }
          }
        : undefined,
      post: postId
        ? {
            connect: {
              id: postId
            }
          }
        : undefined,
      space: {
        connect: {
          id: spaceId
        }
      },
      voteOptions: {
        createMany: {
          data: voteOptions.map((voteOption) => ({
            name: voteOption
          }))
        }
      },
      userVotes: {
        createMany: {
          data: userVotes.map((userVote) => ({
            choice: userVote,
            userId: createdBy
          }))
        }
      },
      type: 'Approval',
      description
    },
    include: {
      voteOptions: true
    }
  });
}
