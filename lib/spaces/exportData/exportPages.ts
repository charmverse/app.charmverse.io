import { Page, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

import { PageWithChildren } from 'lib/pages/server';

// function recursiveInclude ({ level = 0, depth = 10 }: {level?: number, depth?: number}): Prisma.PageInclude {
//   return {
//     children: level === depth ? true : {
//       include: recursiveInclude({ depth, level: level + 1 })
//     },
//     card: true
//   };
// }

// export async function exportSpacePages ({ spaceId }: {spaceId: string}): Promise<Omit<PageWithChildren, 'permissions'>[]> {
//   const rootPages = (await prisma.page.findMany({
//     where: {
//       parentId: null,
//       spaceId,
//       type: {
//         in: ['board', 'page']
//       }
//     },
//     include: recursiveInclude({})
//   })) as Omit<PageWithChildren, 'permissions'>[];

//   return rootPages;
// }
