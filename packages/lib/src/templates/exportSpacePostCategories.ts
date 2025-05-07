import type { PostCategory } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getSpace } from 'lib/spaces/getSpace';

export type PostCategoryExport = {
  postCategories: PostCategory[];
};

export async function exportSpacePostCategories({
  spaceIdOrDomain
}: {
  spaceIdOrDomain: string;
}): Promise<PostCategoryExport> {
  const space = await getSpace(spaceIdOrDomain);

  const postCategories = await prisma.postCategory.findMany({
    where: {
      spaceId: space.id
    }
  });

  return {
    postCategories
  };
}
