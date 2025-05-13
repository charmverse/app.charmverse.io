import type { IViewType } from '@packages/databases/boardView';

import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';

export const iconForViewType = (viewType: IViewType) => {
  switch (viewType) {
    case 'board':
      return <BoardIcon fontSize='small' />;
    case 'table':
      return <TableIcon fontSize='small' />;
    case 'gallery':
      return <GalleryIcon fontSize='small' />;
    case 'calendar':
      return <CalendarIcon fontSize='small' />;
    default:
      return <div />;
  }
};
