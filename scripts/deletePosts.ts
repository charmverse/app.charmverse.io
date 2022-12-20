import { prisma } from 'db'
import { generateDefaultPostCategories } from 'lib/forums/categories/generateDefaultPostCategories'
async function deletePosts () {

  const r = await prisma.post.deleteMany({});
  console.log('deleted ', r.count, 'posts');

  const spaces = await prisma.space.findMany({
    include: {
      postCategories: true,
    }
  });

  let updated = 0;
  for (const space of spaces) {
    if (space.postCategories.length === 0) {
      await prisma.postCategory.createMany({ data: generateDefaultPostCategories(space.id) });
      updated++;
    }
  }

  console.log('Generated categories for' + updated + 'spaces')

}

deletePosts();