
import type { IViewType } from '../blocks/boardView';
import BoardIcon from '../widgets/icons/board';
import CalendarIcon from '../widgets/icons/calendar';
import GalleryIcon from '../widgets/icons/gallery';
import TableIcon from '../widgets/icons/table';

export const iconForViewType = (viewType: IViewType) => {
  switch (viewType) {
    case 'board': return <BoardIcon />;
    case 'table': return <TableIcon />;
    case 'gallery': return <GalleryIcon />;
    case 'calendar': return <CalendarIcon />;
    default: return <div />;
  }
};
