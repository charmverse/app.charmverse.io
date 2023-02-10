import { prisma } from 'db';

import type { CommentEntity, DiscussionEntity, SpaceEntity, UserEntity } from './interfaces';

export async function getCommentEntity(id: string): Promise<CommentEntity> {
  const comment = await prisma.postComment.findUniqueOrThrow({
    where: {
      id
    }
  });
  const author = await getUserEntity(comment.createdBy);
  return {
    author,
    createdAt: comment.createdAt.toISOString(),
    id: comment.id,
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
    author,
    id: post.id,
    title: post.title,
    category: { id: post.category.id, name: post.category.name },
    url: `https://app.charmverse.io/${post.space.domain}/forum/post/${post.path}`
  };
}

export async function getSpaceEntity(id: string): Promise<SpaceEntity> {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id
    }
  });
  return {
    id: space.id,
    name: space.name,
    avatar: space.spaceImage,
    url: `https://app.charmverse.io/${space.domain}`
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
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    googleEmail: user.googleAccounts[0]?.email,
    wallet: user.wallets[0]?.address,
    discordId: user.discordUser?.discordId
  };
}
