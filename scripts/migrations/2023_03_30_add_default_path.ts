import { prisma } from 'db';
import { uid } from 'lib/utilities/strings';

async function init() {

  const users = await prisma.user.findMany({
    select: {
      id: true,
      path: true
    }
  })

  for (const user of users) {
    if (!user.path) {
      await prisma.user.update({
        where: {
          id: user.id
        },
        data: {
          path: uid()
        }
      })
    }
  }
}

init();