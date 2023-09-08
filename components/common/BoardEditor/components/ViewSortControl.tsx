import { Menu } from '@mui/material';
import { bindMenu, bindTrigger, type PopupState } from 'material-ui-popup-state/hooks';
import { FormattedMessage } from 'react-intl';

import ViewHeaderSortMenu from 'components/common/BoardEditor/focalboard/src/components/viewHeader/viewHeaderSortMenu';
import { Button } from 'components/common/Button';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';

type Props = {
  viewSortPopup: PopupState;
  activeView: BoardView;
  activeBoard?: Board;
  cards: Card[];
};

export function ViewSortControl({ viewSortPopup, activeView, activeBoard, cards }: Props) {
  return (
    <>
      <Button
        color={activeView.fields.sortOptions?.length > 0 ? 'primary' : 'secondary'}
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
