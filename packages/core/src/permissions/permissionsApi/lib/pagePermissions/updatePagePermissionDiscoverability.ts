import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import type { UpdatePagePermissionDiscoverabilityRequest } from '@packages/core/pages';
import { resolvePageTree } from '@packages/core/pages';

export async function updatePagePermissionDiscoverability({
  allowDiscovery,
  permissionId,
  tx
}: UpdatePagePermissionDiscoverabilityRequest & { tx?: Prisma.TransactionClient }): Promise<void> {
  if (!tx) {
    return prisma.$transaction(txHandler);
  }

  return txHandler(tx);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  async function txHandler(tx: Prisma.TransactionClient) {
    const upsertedPermission = await tx.pagePermission.findUniqueOrThrow({
      where: {
        id: permissionId
      }
    });

    if (!upsertedPermission.public) {
      throw new InvalidInputError(`This method is only for public pages`);
    }

    const { flatChildren } = await resolvePageTree({
      pageId: upsertedPermission.pageId,
      flattenChildren: true,
      tx
    });

    const childIds = flatChildren.map((c) => c.id);

    await tx.pagePermission.update({
      where: {
        id: upsertedPermission.id
      },
      data: {
        inheritedFromPermission: null,
        allowDiscovery
      }
    });

    await tx.pagePermission.updateMany({
      where: {
        pageId: {
          in: childIds
        },
        public: true
      },
      data: {
        inheritedFromPermission: upsertedPermission.inheritedFromPermission ? upsertedPermission.id : undefined,
        allowDiscovery
      }
    });
  }
}
