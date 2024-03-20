import { Menu } from '@mui/material';
import { bindMenu, bindTrigger, type PopupState } from 'material-ui-popup-state/hooks';
import { FormattedMessage } from 'react-intl';

import ViewHeaderSortMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderSortMenu';
import { Button } from 'components/common/Button';
import { useViewSortOptions } from 'hooks/useViewSortOptions';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import type { Card } from 'lib/databases/card';

type Props = {
  viewSortPopup: PopupState;
  activeView: BoardView;
  activeBoard?: Board;
  cards: Card[];
};

export function ViewSortControl({ viewSortPopup, activeView, activeBoard, cards }: Props) {
  const sortOptions = useViewSortOptions(activeView);

  return (
    <>
      <Button
        color={sortOptions?.length > 0 ? 'primary' : 'secondary'}
        variant='text'
        size='small'
        sx={{ minWidth: 0 }}
        {...bindTrigger(viewSortPopup)}
      >
        <FormattedMessage id='ViewHeader.sort' defaultMessage='Sort' />
      </Button>
      <Menu
        {...bindMenu(viewSortPopup)}
        PaperProps={{
          sx: {
            overflow: 'visible'
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
        <ViewHeaderSortMenu
          properties={activeBoard?.fields.cardProperties ?? []}
          activeView={activeView}
          orderedCards={cards}
        />
      </Menu>
    </>
  );
}
