
import type { PageType } from '@prisma/client';

import type { BaseEvent, BaseEventWithoutGroup } from 'lib/metrics/mixpanel/interfaces/BaseEvent';

import type { ResourceEvent } from './ResourceEvent';

export type PageEvent = ResourceEvent;
type CustomPageType = 'settings' | 'proposals_list' | 'bounties_list' | 'nexus' | 'profile' | 'integrations'

type CustomPageViewEvent = BaseEventWithoutGroup & {
  resourceId?: string;
  spaceId?: string;
  type: CustomPageType;
}

export type PageViewEvent = BaseEvent & {
  resourceId?: string;
  type: PageType;
};

export type PageWithNameEvent = PageEvent & {
  pageName: string;
}

export interface PageEventMap {
  page_view: PageViewEvent | CustomPageViewEvent;
  archive_page: PageEvent;
  delete_page: PageEvent;
  restore_page: PageEvent;
  export_to_markdown: PageEvent;
  edit_page: PageEvent;
  create_page: PageWithNameEvent;
  create_a_database: PageWithNameEvent;
}

export type PageEventNames = keyof PageEventMap;
