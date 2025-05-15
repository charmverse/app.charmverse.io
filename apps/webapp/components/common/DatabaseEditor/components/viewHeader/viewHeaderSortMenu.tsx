import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import type { IPropertyTemplate } from '@packages/databases/board';
import type { BoardView, ISortOption } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import mutator from '@packages/databases/mutator';
import React, { useCallback } from 'react';

import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useViewSortOptions } from 'hooks/useViewSortOptions';

import { iconForPropertyType } from '../../widgets/iconForPropertyType';

type Props = {
  properties: readonly IPropertyTemplate[];
  activeView: BoardView;
  orderedCards: Card[];
};
const ViewHeaderSortMenu = React.memo((props: Props) => {
  const { properties, activeView, orderedCards } = props;
  const sortDisplayOptions = properties
    ?.filter((o) => o.type !== 'proposalReviewerNotes')
    ?.map((o) => ({ id: o.id, name: o.name, icon: iconForPropertyType(o.type) }));
  sortDisplayOptions?.unshift({ id: Constants.titleColumnId, icon: iconForPropertyType('text'), name: 'Title' });
  const localViewSettings = useLocalDbViewSettings();

  const sortOptions = useViewSortOptions(activeView);

  const changeViewSortOptions = (newSortOptions: ISortOption[]) => {
    // update sort locally if local settings context exist
    if (localViewSettings) {
      localViewSettings.setLocalSort(newSortOptions);
      return;
    }

    mutator.changeViewSortOptions(activeView.id, sortOptions, newSortOptions);
  };

  const sortChanged = useCallback(
    (propertyId: string) => {
      let newSortOptions: ISortOption[] = [];
      if (sortOptions && sortOptions[0] && sortOptions[0].propertyId === propertyId) {
        // Already sorting by name, so reverse it
        newSortOptions = [{ propertyId, reversed: !sortOptions[0].reversed }];
      } else {
        newSortOptions = [{ propertyId, reversed: false }];
      }

      changeViewSortOptions(newSortOptions);
    },
    [sortOptions, activeView.id, localViewSettings]
  );

  const onManualSort = useCallback(() => {
    // This sets the manual card order to the currently displayed order
    // Note: Perform this as a single update to change both properties correctly
    const newView = { ...activeView, fields: { ...activeView.fields } };
    newView.fields.cardOrder = orderedCards.map((o) => o.id || '') || [];
    newView.fields.sortOptions = [];
    mutator.updateBlock(newView, activeView, 'reorder');
  }, [activeView, orderedCards]);

  const onRevertSort = useCallback(() => {
    changeViewSortOptions([]);
  }, [activeView.id, sortOptions]);

  return (
    <>
      {sortOptions?.length > 0 && (
        <>
          <MenuItem id='manual' onClick={onManualSort}>
            Manual
          </MenuItem>
          <MenuItem id='revert' onClick={onRevertSort}>
            Revert
          </MenuItem>
          <Divider />
        </>
      )}

      {sortDisplayOptions?.map((option) => {
        let rightIcon: JSX.Element | undefined;
        if (sortOptions?.length > 0) {
          const sortOption = sortOptions[0];
          if (sortOption.propertyId === option.id) {
            rightIcon = sortOption.reversed ? (
              <ArrowDownwardOutlinedIcon color='secondary' fontSize='small' />
            ) : (
              <ArrowUpwardOutlinedIcon color='secondary' fontSize='small' />
            );
          }
        }
        return (
          <MenuItem key={option.id} id={option.id} onClick={() => sortChanged(option.id)}>
            {option.icon && <ListItemIcon>{option.icon}</ListItemIcon>}
            <ListItemText>{option.name}</ListItemText>
            {/* override minWidth from global theme */}
            <ListItemIcon sx={{ minWidth: '0 !important' }}>{rightIcon}</ListItemIcon>
          </MenuItem>
        );
      })}
    </>
  );
});

export default ViewHeaderSortMenu;
