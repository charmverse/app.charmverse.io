import type { ResourceEvent } from './ResourceEvent';
import type { SpaceEvent } from './SpaceEvent';

type PageEvent = SpaceEvent & ResourceEvent;

export interface PageEventMap {
  page_load: PageEvent;
  archive_page: PageEvent;
  delete_page: PageEvent;
  restore_page: PageEvent;
  export_to_markdown: PageEvent;
  edit_page: PageEvent;
}

export type PageEventNames = keyof PageEventMap;
