import type { Post, PostCategory, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/core/errors';
import { getPostPath } from '@packages/lib/forums/posts/getPostPath';
import { v4 as uuid } from 'uuid';

import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import { importPostCategories } from './importPostCategories';
import type { ImportParams } from './interfaces';

export type ForumPostImportResult = {
  posts: Post[];
  postCategories: PostCategory[];
  postCategoriesIdHashMap: Record<string, string>;
  postsIdHashmap: Record<string, string>;
};

export async function importForumPosts(importParams: ImportParams): Promise<ForumPostImportResult> {
  const { posts } = await getImportData(importParams);

  if (!posts) {
    throw new DataNotFoundError(`Posts not found in export data`);
  }

  const { oldNewIdMap, postCategories } = await importPostCategories(importParams);

  const targetSpace = await getSpace(importParams.targetSpaceIdOrDomain);

  const postIdsHashmap: Record<string, string> = {};

  const mappedPosts = posts.map((p) => {
    const newId = uuid();

    postIdsHashmap[p.id] = newId;

    return {
      ...p,
      id: newId,
      path: getPostPath(p.title),
      content: p.content as Prisma.InputJsonValue,
      categoryId: oldNewIdMap[p.categoryId],
      createdAt: new Date(),
      updatedAt: new Date(),
      spaceId: targetSpace.id,
      createdBy: targetSpace.createdBy,
      proposalId: null
    };
  });

  await prisma.post.createMany({ data: mappedPosts });

  return {
    postCategories,
    postsIdHashmap: postIdsHashmap,
    postCategoriesIdHashMap: oldNewIdMap,
    posts: mappedPosts as Post[]
  };
}
