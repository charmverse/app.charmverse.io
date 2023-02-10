import { baseUrl } from 'config/constants';
import { prisma } from 'db';

import type {
  BountyEntity,
  CommentEntity,
  DiscussionEntity,
  ProposalEntity,
  SpaceEntity,
  UserEntity
} from './interfaces';

export async function getBountyEntity(id: string): Promise<BountyEntity> {
  const bounty = await prisma.bounty.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      page: true,
      space: true
    }
  });
  return {
    createdAt: bounty.createdAt.toISOString(),
    id: bounty.id,
    title: bounty.page?.title ?? '',
    rewardToken: bounty.rewardToken,
    rewardChain: bounty.chainId,
    rewardAmount: bounty.rewardAmount,
    url: `${baseUrl}/${bounty.space.domain}/bounties/${bounty.id}`
  };
}

export async function getCommentEntity(id: string): Promise<CommentEntity> {
  const comment = await prisma.postComment.findUniqueOrThrow({
    where: {
      id
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

export async function getPostEntity(id: string): Promise<DiscussionEntity> {
  const post = await prisma.post.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      category: true,
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
      authors: true,
      page: true,
      space: true
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

export async function getUserEntity(id: string): Promise<UserEntity> {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id
    },
    include: {
      wallets: true,
      googleAccounts: true,
      discordUser: true
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
