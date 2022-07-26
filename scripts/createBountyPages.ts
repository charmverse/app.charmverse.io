import { Bounty, PageType, Prisma } from 'prisma/prisma-client';
import log from 'lib/log';
import { prisma } from '../db';

(async () => {
  const bounties: Partial<Bounty>[] = await prisma.bounty.findMany({
    include: {
      page: true
    }
  });

  log.info('Number of bounties: ', bounties.length);

  const result = await Promise.all(
    bounties.map(async bounty => {
      if (bounty.linkedPageId) {
        const page = await prisma.page.update({
          where: {
            cardId: bounty.linkedPageId
          },
          data: {
            type: PageType.card,
            bounty: {
              connect: {
                id: bounty.id
              }
            }
          }
        });

        return prisma.bounty.update({
          where: {
            id: bounty.id
          },
          data: {
            title: page?.title || '',
            description: page?.contentText,
            descriptionNodes: page?.content as string
          }
        });
      }
      else {
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
      }
    })
  );

  log.info('Number of created pages: ', result.length);
})();
