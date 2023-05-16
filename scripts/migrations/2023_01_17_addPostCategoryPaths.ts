import { prisma } from '@charmverse/core/prisma-client';
import { getPostCategoryPath } from 'lib/forums/categories/getPostCategoryPath';

const concurrent = 3;

export async function provisionPostcategoryPaths() {
  const postCategories = await prisma.postCategory.findMany({
    where: {
      path: null
    }
  });

  for (let i = 0; i < postCategories.length; i += concurrent) {
    await Promise.all(
      postCategories.slice(i, i + concurrent).map(async (postCategory) => {
        return prisma.postCategory.update({
          where: {
            id: postCategory.id
          },
          data: {
            path: getPostCategoryPath(postCategory.name)
          }
        });
      })
    );

    console.log('Processed', i + 1, '-', i + 1 + concurrent, 'of', postCategories.length, 'post categories.');
  }

  return postCategories.length;
}
