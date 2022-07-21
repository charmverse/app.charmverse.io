import { Bounty, PageType, Prisma } from 'prisma/prisma-client';
import log from 'lib/log';
import { prisma } from '../db';

(async () => {
  const bounties: Array<Partial<Bounty>> = await prisma.bounty.findMany();

  log.info('Number of bounties: ', bounties.length);

  const result = await Promise.all(
    bounties.map(async bounty => {
      const pageData: Prisma.PageCreateInput = {
        path: `page-${Math.random().toString().replace('0.', '')}`,
        title: bounty.title || '',
        contentText: bounty.description || '',
        content: bounty.descriptionNodes as string,
        bounty: {
          connect: {
            id: bounty.id
          }
        },
        space: {
          connect: {
            id: bounty.spaceId
          }
        },
        updatedBy: bounty.createdBy || '',
        author: {
          connect: {
            id: bounty.createdBy
          }
        },
        type: PageType.bounty
      };

      return prisma.page.create({
        data: pageData
      });
    })
  );

  log.info('Number of created pages: ', result.length);
})();
