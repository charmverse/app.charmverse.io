import { prisma } from 'db';
import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';

export async function getForumCategories ({ spaceId, userId }: AvailableResourcesRequest): Promise<string[]> {
  // const categories = await prisma.forumCategories.findUnique({});
  const categories = ['Announcements', 'Governance', 'Randoms', 'NFTS', 'Introductions', 'Question & Support', 'New York', 'Devcon VI'];
  return categories;
}
