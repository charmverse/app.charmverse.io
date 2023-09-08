import { prisma } from '@charmverse/core/prisma-client';

// Get a count of all the space an user is part of
export async function getSpacesOfUser(userId: string) {
  const { spacesOrder } = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      spacesOrder: true
    }
  });

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      userId
    },
    select: {
      createdAt: true,
      space: true
    }
  });

  const spaces = spaceRoles.map((sr) => ({ ...sr.space, joinDate: sr.createdAt }));
  const sortedSpaceIds = getSortedSpaceIds(spaces, spacesOrder);
  spaces.sort((a, b) => sortedSpaceIds.indexOf(a.id) - sortedSpaceIds.indexOf(b.id));

  return spaces;
}

// There are cases where we join/create/delete a space and the spacesOrder is not updated. With this we make sure that the spacesOrder is always up to date.
function getSortedSpaceIds<T extends { id: string }>(spaces: T[], spacesOrder?: string[]) {
  if (spacesOrder && spacesOrder.length === spaces.length) {
    return spacesOrder;
  }

  if (spacesOrder && spacesOrder.length !== spaces.length) {
    const notIncludedSpaceIds = spaces.filter((sp) => !spacesOrder.includes(sp.id)).map((sp) => sp.id);
    return [...spacesOrder, ...notIncludedSpaceIds];
  }

  return spaces.map((space) => space.id);
}
