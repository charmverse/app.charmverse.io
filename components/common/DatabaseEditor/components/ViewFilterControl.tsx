import { Popover } from '@mui/material';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { Button } from 'components/common/Button';
import { usePages } from 'hooks/usePages';
import { useViewFilter } from 'hooks/useViewFilter';
import type { Board } from 'lib/databases/board';
import type { BoardView } from 'lib/databases/boardView';
import { getRelationPropertiesCardsRecord } from 'lib/databases/getRelationPropertiesCardsRecord';

import FilterComponent from './viewHeader/filterComponent';

type Props = {
  activeBoard: Board | undefined;
  activeView: BoardView;
};

export function ViewFilterControl({ activeBoard, activeView }: Props) {
  const filter = useViewFilter(activeView);
  const hasFilter = filter && filter.filters?.length > 0;
  const viewFilterPopup = usePopupState({ variant: 'popover', popupId: 'view-filter' });
  const { pages } = usePages();

  const relationPropertiesCardsRecord = useMemo(
    () =>
      activeBoard?.fields && pages
        ? getRelationPropertiesCardsRecord({
            cards: Object.values(pages),
            properties: activeBoard.fields.cardProperties
          })
        : {},
    [pages, activeBoard]
  );

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
