import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl } from '@packages/config/constants';

import type {
  ApplicationEntity,
  BlockCommentEntity,
  RewardEntity,
  CommentEntity,
  DocumentEntity,
  InlineCommentEntity,
  PostEntity,
  ProposalEntity,
  SpaceEntity,
  UserEntity,
  VoteEntity,
  ApplicationCommentEntity
} from './interfaces';

export async function getRewardEntity(id: string): Promise<RewardEntity> {
  const bounty = await prisma.bounty.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      page: {
        select: {
          title: true,
          path: true
        }
      },
      space: {
        select: {
          domain: true
        }
      }
    }
  });
  return {
    createdAt: bounty.createdAt.toISOString(),
    id: bounty.id,
    title: bounty.page?.title ?? '',
    rewardToken: bounty.rewardToken,
    rewardChain: bounty.chainId,
    rewardAmount: bounty.rewardAmount,
    url: `${baseUrl}/${bounty.space.domain}/${bounty.page?.path}`,
    customReward: bounty.customReward,
    author: await getUserEntity(bounty.createdBy)
  };
}

export async function getCommentEntity(id: string, isPostComment?: boolean): Promise<CommentEntity> {
  const comment = isPostComment
    ? await prisma.postComment.findUniqueOrThrow({
        where: {
          id
        },
        select: {
          createdAt: true,
          createdBy: true,
          parentId: true
        }
      })
    : await prisma.pageComment.findUniqueOrThrow({
        where: {
          id
        },
        select: {
          createdAt: true,
          createdBy: true,
          parentId: true
        }
      });
  const author = await getUserEntity(comment.createdBy);
  return {
    id,
    author,
    createdAt: comment.createdAt.toISOString(),
    parentId: comment.parentId
  };
}

export async function getInlineCommentEntity(id: string): Promise<InlineCommentEntity> {
  const inlineComment = await prisma.comment.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      createdAt: true,
      userId: true,
      threadId: true
    }
  });

  const author = await getUserEntity(inlineComment.userId);
  return {
    id,
    author,
    createdAt: inlineComment.createdAt.toISOString(),
    threadId: inlineComment.threadId
  };
}

export async function getPostEntity(id: string): Promise<PostEntity> {
  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      category: {
        select: {
          id: true,
          name: true
        }
      },
      space: {
        select: {
          domain: true
        }
      }
    }
  });
  const author = await getUserEntity(post.createdBy);
  return {
    id,
    author,
    createdAt: post.createdAt.toISOString(),
    title: post.title,
    category: { id: post.category.id, name: post.category.name },
    url: `${baseUrl}/${post.space.domain}/forum/post/${post.path}`
  };
}

export async function getProposalEntity(id: string): Promise<ProposalEntity> {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      authors: {
        select: {
          userId: true
        }
      },
      page: {
        select: {
          title: true,
          path: true,
          createdAt: true
        }
      },
      space: {
        select: {
          domain: true
        }
      }
    }
  });
  const authors = await Promise.all(proposal.authors.map(({ userId }) => getUserEntity(userId)));
  return {
    authors,
    createdAt: proposal.page?.createdAt.toISOString() ?? '',
    id: proposal.id,
    title: proposal.page?.title ?? '',
    url: `${baseUrl}/${proposal.space.domain}/${proposal.page?.path}`
  };
}

export async function getSpaceEntity(id: string): Promise<SpaceEntity> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id
    }
  });
  return {
    id,
    name: space.name,
    avatar: space.spaceImage ?? undefined,
    url: `${baseUrl}/${space.domain}`
  };
}

export async function getBlockCommentEntity(id: string): Promise<BlockCommentEntity> {
  const blockComment = await prisma.block.findUniqueOrThrow({
    where: {
      id,
      type: 'comment'
    },
    select: {
      createdAt: true,
      createdBy: true
    }
  });
  return {
    id,
    createdAt: blockComment.createdAt.toISOString(),
    author: await getUserEntity(blockComment.createdBy)
  };
}

export async function getVoteEntity(id: string): Promise<VoteEntity> {
  const vote = await prisma.vote.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      pageId: true,
      postId: true,
      title: true
    }
  });
  return {
    id,
    page: vote.pageId ? await getDocumentEntity(vote.pageId) : null,
    post: vote.postId ? await getPostEntity(vote.postId) : null,
    title: vote.title
  };
}

export async function getUserEntity(id: string): Promise<UserEntity> {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      wallets: {
        select: {
          address: true
        }
      },
      googleAccounts: {
        select: {
          email: true
        }
      },
      discordUser: {
        select: {
          discordId: true
        }
      }
    }
  });
  return {
    id,
    username: user.username,
    avatar: user.avatar ?? undefined,
    googleEmail: user.googleAccounts[0]?.email,
    walletAddress: user.wallets[0]?.address,
    discordId: user.discordUser?.discordId
  };
}

export async function getApplicationEntity(id: string): Promise<ApplicationEntity> {
  const application = await prisma.application.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      bountyId: true,
      createdAt: true,
      createdBy: true
    }
  });

  return {
    id,
    createdAt: application.createdAt.toISOString(),
    user: await getUserEntity(application.createdBy),
    bounty: await getRewardEntity(application.bountyId)
  };
}

export async function getDocumentEntity(id: string): Promise<DocumentEntity> {
  const document = await prisma.page.findFirstOrThrow({
    where: {
      id
    },
    select: {
      createdBy: true,
      id: true,
      title: true,
      path: true,
      type: true,
      space: {
        select: {
          domain: true
        }
      },
      proposal: {
        select: {
          authors: {
            select: {
              userId: true
            }
          }
        }
      }
    }
  });

  const authors = document.proposal
    ? await Promise.all(document.proposal.authors.map(({ userId }) => getUserEntity(userId)))
    : [await getUserEntity(document.createdBy)];

  return {
    id,
    title: document.title,
    url: `${baseUrl}/${document.space.domain}/${document.path}`,
    type: document.type,
    authors
  };
}

export async function getApplicationCommentEntity(id: string): Promise<ApplicationCommentEntity> {
  const applicationComment = await prisma.applicationComment.findUniqueOrThrow({
    where: {
      id
    },
    select: {
      createdAt: true,
      createdBy: true,
      applicationId: true
    }
  });

  return {
    applicationId: applicationComment.applicationId,
    id,
    author: await getUserEntity(applicationComment.createdBy),
    createdAt: applicationComment.createdAt.toISOString()
  };
}
