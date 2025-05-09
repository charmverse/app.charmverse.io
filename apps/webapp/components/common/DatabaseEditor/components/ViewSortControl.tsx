import { Menu } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { TbArrowsSort } from 'react-icons/tb';

import { useViewSortOptions } from 'hooks/useViewSortOptions';
import type { Board } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';

import IconButton from '../widgets/buttons/iconButton';

import ViewHeaderSortMenu from './viewHeader/viewHeaderSortMenu';

type Props = {
  activeView: BoardView;
  activeBoard?: Board;
  cards: Card[];
};

export function ViewSortControl({ activeView, activeBoard, cards }: Props) {
  const sortOptions = useViewSortOptions(activeView);

  return (
    <SortMenuButton
      hasSort={sortOptions?.length > 0}
      menuItems={
        <ViewHeaderSortMenu
          properties={activeBoard?.fields.cardProperties ?? []}
          activeView={activeView}
          orderedCards={cards}
        />
      }
    />
  );
}

export function SortMenuButton({ hasSort, menuItems }: { hasSort: boolean; menuItems: React.ReactNode }) {
  const viewSortPopup = usePopupState({ variant: 'popover', popupId: 'view-sort' });

  return (
    <>
      <IconButton
        tooltip='Sort'
        icon={
          <TbArrowsSort style={{ color: hasSort ? 'var(--primary-color)' : 'var(--secondary-text)', fontSize: 16 }} />
        }
        style={{ width: '32px' }}
        {...bindTrigger(viewSortPopup)}
      />
      {/* <Button
        color={hasSort ? 'primary' : 'secondary'}
        variant='text'
        size='small'
        sx={{ minWidth: 0 }}
        {...bindTrigger(viewSortPopup)}
      >
        <FormattedMessage id='ViewHeader.sort' defaultMessage='Sort' />
      </Button> */}
      <Menu
        {...bindMenu(viewSortPopup)}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              overflow: 'visible'
            }
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        onClick={() => viewSortPopup.close()}
      >
        {menuItems}
      </Menu>
    </>
  );
}
