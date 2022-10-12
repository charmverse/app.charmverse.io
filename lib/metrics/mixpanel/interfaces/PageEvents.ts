
import type { PageType } from '@prisma/client';

import type { BaseEventWithoutGroup } from './BaseEvent';
import type { PageEvent } from './PageEvent';

type CustomPageType = 'settings' | 'proposals_list' | 'bounties_list' | 'nexus' | 'profile' | 'integrations'

type CustomPageViewEvent = BaseEventWithoutGroup & {
  pageId?: string;
  spaceId?: string;
  type: CustomPageType;
}

type PageViewEvent = PageEvent & {
  type: PageType;
};

export interface PageEventMap {
  page_view: PageViewEvent | CustomPageViewEvent;
  archive_page: PageEvent;
  delete_page: PageEvent;
  restore_page: PageEvent;
  edit_page: PageEvent;
}

export type PageEventNames = keyof PageEventMap;
