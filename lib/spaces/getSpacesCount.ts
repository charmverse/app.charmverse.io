import { prisma } from 'db';

// Get a count of all the space an user is part of
export function getSpacesCount (userId: string) {
  return prisma.space.count({
    where: {
      spaceRoles: {
        some: {
          userId
        }
      }
    }
  });
}
