import { v4 } from 'uuid';

import { prisma } from 'db';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';

import type { ForumPost } from './interfaces';

const mockPost1 = {
  id: '',
  title: 'First Post. Keep it up',
  content: {
    type: 'text' as const,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehe'
  },
  user: undefined as any,
  upVotes: 20,
  downVotes: 32,
  commentsNumber: 32,
  updatedAt: '2022-11-10T12:31:01.626Z' as any,
  createdAt: '2022-06-30T12:48:31.867Z' as any
};

const mockPost2 = {
  id: '',
  title: 'Second Post. Keep it up',
  content: {
    type: 'image' as const,
    content: 'https://cdn.pixabay.com/photo/2022/02/10/09/39/nft-7004985_1280.jpg'
  },
  user: undefined as any,
  upVotes: 20,
  downVotes: 32,
  commentsNumber: 32,
  updatedAt: '2022-05-03T12:31:01.626Z' as any,
  createdAt: '2022-06-30T12:48:31.867Z' as any
};

const mockPost3 = {
  id: '',
  title: 'Third Post. Keep it up',
  content: {
    type: 'text' as const,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehe'
  },
  user: undefined as any,
  upVotes: 20,
  downVotes: 32,
  commentsNumber: 32,
  updatedAt: '2022-01-03T12:31:01.626Z' as any,
  createdAt: '2020-06-30T12:48:31.867Z' as any
};

export async function getForumPosts ({ spaceId, userId }: AvailableResourcesRequest):Promise<ForumPost[]> {
  // const posts = await prisma.forum.findUnique({});
  // Transform the first text or first image into a ForumPostContent interface

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  const posts = [mockPost1, mockPost2, mockPost3].map(item => {
    item.user = user || undefined;
    item.id = v4();
    return item;
  });

  return posts;
}
