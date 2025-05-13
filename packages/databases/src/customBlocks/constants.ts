import type { IViewType } from '../boardView';

export const DEFAULT_BOARD_BLOCK_ID = '__defaultBoard';
export const DEFAULT_VIEW_BLOCK_ID = '__defaultView';
// initially table was default view always
export const DEFAULT_TABLE_VIEW_BLOCK_ID = DEFAULT_VIEW_BLOCK_ID;
export const DEFAULT_CALENDAR_VIEW_BLOCK_ID = '__defaultCalendarView';
export const DEFAULT_BOARD_VIEW_BLOCK_ID = '__defaultBoardView';
export const DEFAULT_GALLERY_VIEW_BLOCK_ID = '__defaultGalleryView';

export const viewTypeToBlockId: Record<IViewType, string> = {
  table: DEFAULT_TABLE_VIEW_BLOCK_ID,
  calendar: DEFAULT_CALENDAR_VIEW_BLOCK_ID,
  board: DEFAULT_BOARD_VIEW_BLOCK_ID,
  gallery: DEFAULT_GALLERY_VIEW_BLOCK_ID
};
