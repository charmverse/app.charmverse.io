
import type { PageType } from '@prisma/client';

import type { BaseEventWithoutGroup } from './BaseEvent';
import type { PageEvent } from './PageEvent';

type CustomPageType = 'settings' | 'proposals_list' | 'bounties_list' | 'nexus' | 'profile' | 'integrations'

type CustomPageViewEvent = BaseEventWithoutGroup & {
  pageId?: string;
  spaceId?: string;
  type: CustomPageType;
}

type PageTypeEvent = PageEvent & {
  type: PageType;
};

export interface PageEventMap {
  page_view: PageTypeEvent | CustomPageViewEvent;
  archive_page: PageEvent;
  delete_page: PageEvent;
  restore_page: PageEvent;
  edit_page: PageEvent;
  create_page: PageTypeEvent;
}

export type PageEventNames = keyof PageEventMap;
