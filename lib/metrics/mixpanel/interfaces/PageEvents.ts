import type { ResourceEvent, SpaceEvent } from 'lib/metrics/mixpanel/interfaces';

type PageEvent = SpaceEvent & ResourceEvent;

export interface PageEvents {
  page_load: PageEvent;
  archive_page: PageEvent;
  delete_page: PageEvent;
  export_to_markdown: PageEvent;
  edit_page: PageEvent;
}

export type PageEventNames = keyof PageEvents;
