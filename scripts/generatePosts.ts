
import {generateForumPosts} from 'testing/forums';
import {prisma} from 'db';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import {validate} from 'uuid';
import { stubPostContent, stubPostContentText } from 'testing/forums.stub';



async function listCategories({spaceDomain}: {spaceDomain: string}) {
  return prisma.postCategory.findMany({
    where: {
      space: {
        domain: spaceDomain
      }
    }
  }).then(categories => {
    console.log(categories)
    return categories
  });
}

/**
 * 
 * @title - Will increment a number at the end of the title for each generated post
 */
async function generatePosts({spaceDomain, count, categoryId, title, withImageRatio}: {spaceDomain: string, count: number, categoryId?: string, title?: string, withImageRatio?: number}) {

  if(categoryId && !validate(categoryId)) {
    throw new InvalidInputError(`Please provide a valid category ID`);
  }


  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  })

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
  })
  return posts
}


async function wipePosts({spaceDomain}: {spaceDomain: string}) {

  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  })

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`);
  }

  await prisma.post.deleteMany({
    where: {
      page: {
        spaceId: space.id
      }
    }
  })

  await prisma.page.deleteMany({
    where: {
      type: 'post',
      spaceId: space.id
    }
  })

}

const spaceDomain = 'rough-copper-constrictor'

// Step 1 - wipe posts
// wipePosts({
//   spaceDomain
// }).then(posts => {
//   console.log('Deleted posts')
// })


const postsPerCategory = 30;

const withImageRatio = 55;
// Step 2 - generate posts in different categories

// autogeneratePosts().then(() => console.log('done'))

function autogeneratePosts() {
  return listCategories({spaceDomain}).then(async categories => {
    for (let i = 0; i <= categories.length; i++) {
      if (i === categories.length) {
        await generatePosts({
          spaceDomain,
          title: `Uncategorised post`,
          count: postsPerCategory,
          withImageRatio,
        })
      } else {
        const category = categories[i];
        await generatePosts({
          spaceDomain,
          title: `${category.name} post`,
          categoryId: category.id,
          count: postsPerCategory,
          withImageRatio,
        })
      }
    }
  
    const totalCategories = categories.length;
  
    console.log(`Generated ${postsPerCategory * (totalCategories + 1)} posts across ${totalCategories } categories`);
    return true
  })
}






