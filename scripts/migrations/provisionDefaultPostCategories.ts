
import { prisma } from 'db'
import { generateDefaultPostCategoriesInput } from 'lib/forums/categories/generateDefaultPostCategories'


export async function provisionDefaultPostCategories() {
  const spaces = await prisma.space.findMany({select: {id: true}})

  await prisma.postCategory.createMany({
    data: spaces.flatMap(space => generateDefaultPostCategoriesInput(space.id))
  })
} 