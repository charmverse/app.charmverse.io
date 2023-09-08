import type { Page } from '@charmverse/core/prisma';

export type DiscussionPropertiesFromPage = Pick<Page, 'bountyId' | 'spaceId' | 'title' | 'id' | 'path'>;

export function getPropertiesFromPage(page: DiscussionPropertiesFromPage, space: { domain: string; name: string }) {
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
