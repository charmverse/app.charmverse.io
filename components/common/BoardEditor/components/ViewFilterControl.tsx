import { Popover } from '@mui/material';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { FormattedMessage } from 'react-intl';

import FilterComponent from 'components/common/BoardEditor/focalboard/src/components/viewHeader/filterComponent';
import { Button } from 'components/common/Button';
import { useViewFilter } from 'hooks/useViewFilter';
import type { Board } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';

import type { PageListItemsRecord } from '../interfaces';

type Props = {
  activeBoard: Board | undefined;
  activeView: BoardView;
  relationPropertiesCardsRecord: PageListItemsRecord;
};

export function ViewFilterControl({ relationPropertiesCardsRecord, activeBoard, activeView }: Props) {
  const filter = useViewFilter(activeView);
  const hasFilter = filter && filter.filters?.length > 0;
  const viewFilterPopup = usePopupState({ variant: 'popover', popupId: 'view-filter' });

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
        <FilterComponent
          properties={activeBoard?.fields.cardProperties ?? []}
          activeView={activeView}
          relationPropertiesCardsRecord={relationPropertiesCardsRecord}
        />
      </Popover>
    </>
  );
}
