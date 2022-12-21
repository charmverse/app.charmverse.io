import type { PageType } from '@prisma/client';

import type { BaseEventWithoutGroup, BaseEvent } from './BaseEvent';

export type PageEvent = BaseEvent & {
  pageId: string;
};

type CustomPageType = 'settings' | 'proposals_list' | 'bounties_list' | 'nexus' | 'profile' | 'integrations';

type CustomPageViewEvent = BaseEventWithoutGroup & {
  pageId?: string;
  spaceId?: string;
  type: CustomPageType;
};

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
  page_comment_created: PageEvent;
  page_comment_resolved: PageEvent;
  poll_created: PageEvent;
  page_suggestion_created: PageEvent;
  page_suggestion_accepted: PageEvent;
  export_page_markdown: PageEvent;
  export_page_csv: PageEvent;
}

export type PageEventName = keyof PageEventMap;
