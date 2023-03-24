import { getAccessiblePages, includePagePermissionsMeta } from 'lib/pages/server';
import { prisma } from 'db';

/**
 * Use this script to perform database searches.
 */

async function search() {
  const user = await prisma.user.findFirst({
    where: {
      spaceRoles: {
        some: {
          spaceId: 'bc9e8464-4166-4f7c-8a14-bb293cc30d2a',
          isAdmin: true
        }
      }
    }
  });
  if (!user) {
    throw new Error('No user found');
  }

  getAccessiblePages({
    search: 'forum',
    spaceId: 'bc9e8464-4166-4f7c-8a14-bb293cc30d2a',
    userId: user.id
  }).then((record) => {
    // eslint-disable-next-line no-console
    console.log(
      record.length,
      record.slice(0, 10).map((r) => r.title)
    );
  });
}

search();
