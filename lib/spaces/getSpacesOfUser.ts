import { prisma } from 'db';

// Get a count of all the space an user is part of
export function getSpacesOfUser (userId: string) {
  return prisma.space.findMany({
    where: {
      spaceRoles: {
        some: {
          userId
        }
      }
    },
    include: {
      spaceRoles: true
    }
  });
}
