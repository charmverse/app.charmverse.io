import type { AvailableResourcesRequest } from 'lib/permissions/interfaces';

export async function getForumCategories({ spaceId }: AvailableResourcesRequest): Promise<string[]> {
  const categories = [
    'Announcements',
    'Governance',
    'Randoms',
    'NFTS',
    'Introductions',
    'Question & Support',
    'New York',
    'Devcon VI'
  ];
  return categories;
}
