import type { ResourceEvent } from './ResourceEvent';

type PageEvent = ResourceEvent;

export interface PageEventMap {
  page_load: PageEvent;
  archive_page: PageEvent;
  delete_page: PageEvent;
  restore_page: PageEvent;
  export_to_markdown: PageEvent;
  edit_page: PageEvent;
}

export type PageEventNames = keyof PageEventMap;
