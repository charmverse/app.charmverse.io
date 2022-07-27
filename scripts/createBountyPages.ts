import { Bounty, Prisma } from 'prisma/prisma-client';
import log from 'lib/log';
import { getBountyPagePermissionSet } from 'lib/bounties/shared';
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
      const bountyPagePermissionSet: Omit<Prisma.PagePermissionCreateManyInput, 'pageId'>[] = getBountyPagePermissionSet({
        createdBy: bounty.createdBy!,
        status: bounty.status!,
        spaceId: bounty.spaceId!,
        permissions: undefined,
        linkedPageId: bounty.linkedTaskId || ''
      });

      if (bounty.linkedTaskId) {
        const [page] = await prisma.$transaction([
          prisma.page.update({
            where: {
              cardId: bounty.linkedTaskId
            },
            data: {
              type: 'card',
              bounty: {
                connect: {
                  id: bounty.id
                }
              }
            }
          }),
          prisma.pagePermission.createMany({
            data: bountyPagePermissionSet.map(p => {
              return {
                ...p,
                pageId: bounty.linkedTaskId!
              };
            })
          })
        ]);

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
          id: bounty.id,
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
          type: 'bounty'
        };

        return prisma.$transaction([
          prisma.page.create({
            data: pageData
          }),
          prisma.pagePermission.createMany({
            data: bountyPagePermissionSet.map(p => {
              return {
                ...p,
                pageId: bounty.id!
              };
            })
          })
        ]);
      }
    })
  );

  log.info('Number of created pages: ', result.length);

})();
