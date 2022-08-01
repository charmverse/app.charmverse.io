import { prisma } from 'db';
import { DataNotFoundError } from 'lib/utilities/errors';
import { v4 } from 'uuid';
import { PageWithProposal, ProposalCreationData } from './interfaces';

export async function createProposal ({ spaceId, userId }: ProposalCreationData): Promise<PageWithProposal> {

  const space = await prisma.space.findUnique({ where: {
    id: spaceId
  },
  select: {
    defaultPagePermissionGroup: true
  } });

  if (!space) {
    throw new DataNotFoundError(`Space with id ${spaceId} not found`);
  }

  const pageId = v4();

  return prisma.page.create({
    data: {
      id: pageId,
      content: undefined as any,
      contentText: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedBy: userId,
      path: `page-${pageId}`,
      permissions: {
        createMany: {
          data: [{
            permissionLevel: 'full_access',
            userId
          }, {
            permissionLevel: 'view',
            spaceId
          }]
        }
      },
      space: {
        connect: {
          id: spaceId
        }
      },
      author: {
        connect: {
          id: userId
        }
      },
      proposal: {
        create: {
          status: 'draft',
          space: {
            connect: {
              id: spaceId
            }
          },
          author: {
            connect: {
              id: userId
            }
          }
        }
      },
      title: '',
      type: 'proposal'
    },
    include: {
      permissions: {
        include: {
          sourcePermission: true
        }
      },
      proposal: true
    }

  }) as Promise<PageWithProposal>;

}
