import { prisma } from '@charmverse/core/prisma-client';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const bountyCards = await prisma.page.findFirst({
    where: {
      path: 'page-6902650775784975'
    },
    include: {
      permissions: true,
      space: {
        include: {
          spaceRoles: {
            include: { user: true }
          }
        }
      }
    }
  });
  console.log(bountyCards.id);
  //console.log(bountyCards?.permissions);
  // console.log(bountyCards?.space.spaceRoles.map((r) => r.user.id + ' ' + r.user.username));
}

search().then(() => console.log('Done'));
