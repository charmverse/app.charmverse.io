import { v4 as uuid } from 'uuid';

import { prisma } from 'db';
import type { AvailableResourcesWithPaginationRequest } from 'pages/api/forum/interfaces';

import type { ForumPost } from './interfaces';

const mockPost1: ForumPost = {
  id: '',
  title: 'First Post. Keep it up',
  content: {
    type: 'text' as const,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehe'
  },
  userId: '',
  upVotes: 20,
  downVotes: 32,
  commentsNumber: 32,
  updatedAt: '2022-11-10T12:31:01.626Z' as any,
  createdAt: '2022-06-30T12:48:31.867Z' as any
};

const mockPost2: ForumPost = {
  id: '',
  title: 'Second Post. Keep it up',
  content: {
    type: 'image' as const,
    content: 'https://cdn.pixabay.com/photo/2022/02/10/09/39/nft-7004985_1280.jpg'
  },
  userId: '',
  upVotes: 12,
  downVotes: 989,
  commentsNumber: 275,
  updatedAt: '2022-05-18T12:31:01.626Z' as any,
  createdAt: '2022-06-30T12:48:31.867Z' as any
};

const mockPost3: ForumPost = {
  id: '',
  title: 'Third Post. Keep it up',
  content: {
    type: 'text' as const,
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehe'
  },
  userId: '',
  upVotes: 8,
  downVotes: 0,
  commentsNumber: 2,
  updatedAt: '2020-01-03T12:31:01.626Z' as any,
  createdAt: '2020-06-30T12:48:31.867Z' as any
};

const mockArr = [mockPost1, mockPost2, mockPost3];

export async function getForumPosts ({ spaceId, userId, count, page, sort }: AvailableResourcesWithPaginationRequest):Promise<ForumPost[]> {
  // const posts = await prisma.forum.findUnique({});
  // Transform the first text or first image into a ForumPostContent interface

  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  const posts = user ? Array(100).fill(null).map(() => mockArr).flat()
    .map(item => {
      return {
        ...item,
        id: uuid(),
        user
      };
    }) : mockArr;

  if (count && page && sort) {
    const start = (count * page) - count;
    const finish = count * page;
    return posts.slice(start, finish);
  }

  return posts;
}
