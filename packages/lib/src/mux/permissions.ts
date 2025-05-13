import { prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError } from '@packages/utils/errors';
import { permissionsApiClient } from '@packages/lib/permissions/api/client';

type VideoPermissionComputeRequest = {
  resourceId: string;
  userId: string;
  spaceId: string;
};
export async function canCreate({ resourceId, userId, spaceId }: VideoPermissionComputeRequest) {
  const [page, post] = await Promise.all([
    prisma.page.findUnique({
      where: {
        id: resourceId
      },
      select: {
        id: true
      }
    }),
    prisma.post.findUnique({
      where: {
        id: resourceId
      },
      select: {
        spaceId: true
      }
    })
  ]);

  if (!post && !page) {
    return _hasAccessToSpace({
      userId,
      spaceId
    });
  } else if (post) {
    return _hasAccessToSpace({
      userId,
      spaceId: post.spaceId
    });
  } else if (page) {
    const pagePermissions = await permissionsApiClient.pages.computePagePermissions({
      resourceId,
      userId
    });
    return pagePermissions.edit_content;
  } else {
    throw new DataNotFoundError(`Page or Post with id ${resourceId} not found`);
  }
}

export async function canView({ resourceId, userId }: VideoPermissionComputeRequest) {
  const [page, post] = await Promise.all([
    prisma.page.findUnique({
      where: {
        id: resourceId
      },
      select: {
        id: true
      }
    }),
    prisma.post.findUnique({
      where: {
        id: resourceId
      },
      select: {
        spaceId: true
      }
    })
  ]);

  if (post) {
    return _hasAccessToSpace({
      userId,
      spaceId: post.spaceId
    });
  } else if (page) {
    const pagePermissions = await permissionsApiClient.pages.computePagePermissions({
      resourceId,
      userId
    });

    return pagePermissions.read;
  } else {
    throw new DataNotFoundError(`Page or Post with id ${resourceId} not found`);
  }
}

async function _hasAccessToSpace({ spaceId, userId }: { spaceId: string; userId: string }) {
  const spaceRoles = await prisma.spaceRole.count({
    where: {
      userId,
      spaceId
    }
  });
  return spaceRoles === 1;
}
