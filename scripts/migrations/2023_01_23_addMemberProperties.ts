import { prisma } from '@charmverse/core/prisma-client';

async function init() {
  const spaces = await prisma.space.findMany({
    include: {
      memberProperties: true
    }
  });

  let count = 0;
  for (let space of spaces) {
    if (count++ % 100 === 0) {
      console.log('updated', count, 'spaces');
    }
    if (!space.memberProperties.some((prop) => prop.type === 'linked_in')) {
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
        // we want to inject these after the last social property
        const lastSocialIndex = Math.max(
          ...space.memberProperties
            .filter((prop) => prop.type === 'twitter' || prop.type === 'discord')
            .map((prop) => prop.index)
        );

        const createdBy = admin.id;
        await prisma.$transaction([
          // update all indexes after the last social index
          prisma.memberProperty.updateMany({
            where: {
              spaceId: space.id,
              index: {
                gt: lastSocialIndex
              }
            },
            data: {
              index: {
                increment: 2
              }
            }
          }),
          prisma.memberProperty.createMany({
            data: [
              {
                createdBy,
                updatedBy: createdBy,
                index: lastSocialIndex + 1,
                name: 'LinkedIn',
                type: 'linked_in',
                spaceId: space.id
              },
              {
                createdBy,
                updatedBy: createdBy,
                index: lastSocialIndex + 2,
                name: 'GitHub',
                type: 'github',
                spaceId: space.id
              }
            ]
          })
        ]);
      } else {
        console.warn('No admin for space', { spaceId: space.id, spaceName: space.name });
      }
    }
  }
}

init();
