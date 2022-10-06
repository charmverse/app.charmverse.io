
import type { PageType } from '@prisma/client';

import type { BaseEvent } from 'lib/metrics/mixpanel/interfaces/BaseEvent';

import type { ResourceEvent } from './ResourceEvent';

type PageEvent = ResourceEvent;
type CustomPageView = 'settings' | 'proposals_list' | 'bounties_list'
type PageViewEvent = BaseEvent & {
  resourceId?: string;
  type: PageType | CustomPageView;
};

export interface PageEventMap {
  page_view: PageViewEvent;
  archive_page: PageEvent;
  delete_page: PageEvent;
  restore_page: PageEvent;
  export_to_markdown: PageEvent;
  edit_page: PageEvent;
}

export type PageEventNames = keyof PageEventMap;
