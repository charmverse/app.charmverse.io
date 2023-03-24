import type { Page } from '@prisma/client';

export function getPropertiesFromPage(
  page: Pick<Page, 'bountyId' | 'spaceId' | 'title' | 'id' | 'path'>,
  space: { domain: string; name: string }
) {
  return {
    pageId: page.id,
    spaceId: page.spaceId,
    spaceDomain: space.domain,
    pagePath: page.path,
    spaceName: space.name,
    pageTitle: page.title || 'Untitled',
    bountyId: page.bountyId,
    bountyTitle: page.title,
    type: page.bountyId ? 'bounty' : 'page'
  } as const;
}
