import { prisma } from 'db';
import { PublicSpaceInfo } from './interfaces';

export async function getSpacePublicInfo (spaceId: string): Promise<PublicSpaceInfo | null> {
  return prisma.space.findUnique({
    where: {
      id: spaceId
    },
    select: {
      id: true,
      domain: true
    }
  });

}
