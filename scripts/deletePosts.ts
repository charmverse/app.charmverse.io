import { prisma } from 'db'
import { generateDefaultPostCategories } from 'lib/forums/categories/generateDefaultPostCategories'
async function deletePosts () {
  await prisma.post.deleteMany({});
  const spaces = await prisma.space.findMany({
    include: {
      postCategories: true,
    }
  });

  for (const space of spaces) {
    if (space.postCategories.length === 0) {
      await prisma.postCategory.createMany({ data: generateDefaultPostCategories(space.id) });
    }
  }

}

deletePosts();