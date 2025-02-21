import { generateForumPosts } from '@packages/testing/forums';
import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/utils/errors';
import { validate } from 'uuid';
import { stubPostContent, stubPostContentText } from '@packages/testing/forums.stub';

async function listCategories({ spaceDomain }: { spaceDomain: string }) {
  return prisma.postCategory
    .findMany({
      where: {
        space: {
          domain: spaceDomain
        }
      }
    })
    .then((categories) => {
      console.log(categories);
      return categories;
    });
}

/**
 *
 * @title - Will increment a number at the end of the title for each generated post
 */
async function generatePosts({
  spaceDomain,
  count,
  categoryId,
  title,
  withImageRatio
}: {
  spaceDomain: string;
  count: number;
  categoryId?: string;
  title?: string;
  withImageRatio?: number;
}) {
  if (categoryId && !validate(categoryId)) {
    throw new InvalidInputError(`Please provide a valid category ID`);
  }

  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`);
  }

  const posts = await generateForumPosts({
    spaceId: space.id,
    categoryId,
    createdBy: space.createdBy,
    count,
    content: stubPostContent,
    contentText: stubPostContentText,
    title,
    withImageRatio
  });
  return posts;
}

async function wipePosts({ spaceDomain }: { spaceDomain: string }) {
  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`);
  }

  await prisma.post.deleteMany({
    where: {
      spaceId: space.id
    }
  });
}

// Step 2 - generate posts in different categories

function autogeneratePosts({
  spaceDomain,
  postsPerCategory = 10,
  withImageRatio = 50
}: {
  spaceDomain: string;
  postsPerCategory?: number;
  withImageRatio?: number;
}) {
  return listCategories({ spaceDomain }).then(async (categories) => {
    for (let i = 0; i <= categories.length; i++) {
      if (i === categories.length) {
        await generatePosts({
          spaceDomain,
          title: `Uncategorised post`,
          count: postsPerCategory,
          withImageRatio
        });
      } else {
        const category = categories[i];
        await generatePosts({
          spaceDomain,
          title: `${category.name} post`,
          categoryId: category.id,
          count: postsPerCategory,
          withImageRatio
        });
      }
    }

    const totalCategories = categories.length;

    console.log(`Generated ${postsPerCategory * (totalCategories + 1)} posts across ${totalCategories} categories`);
    return true;
  });
}

const spaceDomain = 'shivering-solana-rooster';

const postsPerCategory = 40;

const withImageRatio = 55;

// wipePosts({
//   spaceDomain
// }).then(posts => {
//   autogeneratePosts({
//     spaceDomain,
//     postsPerCategory,
//     withImageRatio
//   }).then(() => console.log('done'))
// }).catch(err => {
//   console.log(err);
// })
