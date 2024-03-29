import { prisma } from '@charmverse/core/prisma-client';
import { uniq } from 'lodash';
/**
 * Use this script to perform database searches.
 */

const userId = '4e1d4522-6437-4393-8ed1-9c56e53235f4';

async function search() {
  const acc = await prisma.userSpaceAction.findFirst({
    where: {
      createdBy: userId,
      action: 'view_page',
      // pageType: {
      //   in: pageTypes
      // },
      spaceId: 'bc9e8464-4166-4f7c-8a14-bb293cc30d2a'
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      meta: true,
      spaceId: true,
      pageType: true,
      page: {
        select: {
          id: true,
          path: true
        }
      },
      post: {
        select: {
          id: true,
          path: true
        }
      }
    }
  });
  console.log(acc);
}

search().then(() => console.log('Done'));
