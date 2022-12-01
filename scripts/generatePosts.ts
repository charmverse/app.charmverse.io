
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

// wipePosts({
//   spaceDomain: 'rough-copper-constrictor'
// }).then(posts => {
//   console.log('Deleted posts')
// })


// listCategories({spaceDomain: 'rough-copper-constrictor'}).then(categories => {
//   console.log('Done')
// })


const postsToGenerate = 50;


generatePosts({spaceDomain: 'rough-copper-constrictor', title: `Governance post`, count: postsToGenerate, withImageRatio: 50, categoryId: '50e1081a-385c-4308-ae0d-35f91f132880' }).then(() => {
  console.log('Generated', postsToGenerate, 'posts')
})


