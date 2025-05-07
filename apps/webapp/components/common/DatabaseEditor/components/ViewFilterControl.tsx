import { FilterList } from '@mui/icons-material';
import { Popover } from '@mui/material';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { useViewFilter } from 'hooks/useViewFilter';
import type { Board } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';

import IconButton from '../widgets/buttons/iconButton';

import FilterComponent from './viewHeader/filterComponent';

type Props = {
  activeBoard: Board | undefined;
  activeView: BoardView;
};

export function ViewFilterControl({ activeBoard, activeView }: Props) {
  const filter = useViewFilter(activeView);
  const hasFilter = filter && filter.filters?.length > 0;
  const viewFilterPopup = usePopupState({ variant: 'popover', popupId: 'view-filter' });

  return (
    <>
      <IconButton
        tooltip='Filter'
        icon={
          <FilterList data-test='view-filter-button' color={hasFilter ? 'primary' : 'secondary'} fontSize='small' />
        }
        style={{ width: '32px' }}
        {...bindTrigger(viewFilterPopup)}
      />
      <Popover
        {...bindPopover(viewFilterPopup)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        sx={{
          overflow: 'auto'
        }}
        slotProps={{
          paper: {
            sx: {
              overflowX: {
                xs: 'auto',
                sm: 'hidden'
              }
            }
          }
        }}
      >
        <FilterComponent properties={activeBoard?.fields.cardProperties ?? []} activeView={activeView} />
      </Popover>
    </>
  );
}
