import type { PageListItem } from '../PagesList';

export type PropertyValueDisplayType = 'details' | 'kanban' | 'calendar' | 'gallery' | 'table';
export type PageListItemsRecord = Record<string, PageListItem[]>;
