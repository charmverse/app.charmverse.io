import { Popover } from '@mui/material';
import { bindPopover, bindTrigger, type PopupState } from 'material-ui-popup-state/hooks';
import { FormattedMessage } from 'react-intl';

import FilterComponent from 'components/common/BoardEditor/focalboard/src/components/viewHeader/filterComponent';
import { Button } from 'components/common/Button';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

type Props = {
  activeBoard: Board | undefined;
  activeView: BoardView;
  viewFilterPopup: PopupState;
};

export function ViewFilterControl({ activeBoard, activeView, viewFilterPopup }: Props) {
  const hasFilter = activeView?.fields.filter && activeView?.fields.filter.filters?.length > 0;

  return (
    <>
      <Button
        color={hasFilter ? 'primary' : 'secondary'}
        variant='text'
        size='small'
        sx={{ minWidth: 0 }}
        {...bindTrigger(viewFilterPopup)}
      >
        <FormattedMessage id='ViewHeader.filter' defaultMessage='Filter' />
      </Button>
      <Popover
        {...bindPopover(viewFilterPopup)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        sx={{
          overflow: 'auto'
        }}
      >
        <FilterComponent properties={activeBoard?.fields.cardProperties ?? []} activeView={activeView} />
      </Popover>
    </>
  );
}
