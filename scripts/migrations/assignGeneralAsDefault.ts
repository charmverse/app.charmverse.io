import {prisma} from 'db';
import { setDefaultPostCategory } from 'lib/forums/categories/setDefaultPostCategory';

async function assignSpaceCategories() {

  const generalCategories = await prisma.postCategory.findMany({
    where: {
      name: 'General',
      space: {
        defaultPostCategoryId: null
      }
    },
    select: {
      spaceId: true,
      id: true
    }
  })

  for (let i = 0; i < generalCategories.length; i++) {
    const generalCategory = generalCategories[i];
    await setDefaultPostCategory({
      postCategoryId: generalCategory.id,
      spaceId: generalCategory.spaceId
    })

    console.log(`Processed space`, i +1, ` / `, generalCategories.length)
  }
  
}

// assignSpaceCategories().then(() => {console.log('Done')})