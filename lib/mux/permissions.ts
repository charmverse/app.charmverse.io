import { prisma } from 'db';
import { computeUserPagePermissions } from 'lib/permissions/pages';

export async function canCreate({ pageId, userId }: { pageId: string; userId: string }) {
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    }
  });

  if (page.type === 'post') {
    return _hasAccessToSpace({
      userId,
      spaceId: page.spaceId
    });
  } else {
    const pagePermissions = await computeUserPagePermissions({
      pageId,
      userId
    });

    return pagePermissions.edit_content;
  }
}

export async function canView({ pageId, userId }: { pageId: string; userId: string }) {
  const page = await prisma.page.findUniqueOrThrow({
    where: {
      id: pageId
    }
  });

  if (page.type === 'post') {
    return _hasAccessToSpace({
      userId,
      spaceId: page.spaceId
    });
  } else {
    const pagePermissions = await computeUserPagePermissions({
      pageId,
      userId
    });

    return pagePermissions.read;
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
