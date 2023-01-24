import { prisma } from 'db'

async function init () {

  const spaces = await prisma.space.findMany({
    include: {
      memberProperties: true
    }
  });

  let count = 0;
  for (let space of spaces) {
    if (count++ % 100 === 0) {
      console.log('updated', count, 'spaces')
    }
    if (!space.memberProperties.some(prop => prop.type === 'linked_in')) {
      const admin = await prisma.user.findFirst({
        where: {
          spaceRoles: {
            some: {
              isAdmin: true,
              spaceId: space.id
            }
          }
        }
      });
      if (admin) {
        const lastIndex = Math.max(...space.memberProperties.map(prop => prop.index));
        console.log('lastIndex', lastIndex)
        const createdBy = admin.id;
        await prisma.memberProperty.createMany({
          data: [{
            createdBy,
            updatedBy: createdBy,
            index: lastIndex + 1,
            name: 'LinkedIn',
            type: 'linked_in',
            spaceId: space.id
          },{
            createdBy,
            updatedBy: createdBy,
            index: lastIndex + 2,
            name: 'GitHub',
            type: 'github',
            spaceId: space.id
          }],
        })
      }
      else {
        console.warn('No admin for space', { spaceId: space.id, spaceName: space.name })
      }
    }
  }


}

init()