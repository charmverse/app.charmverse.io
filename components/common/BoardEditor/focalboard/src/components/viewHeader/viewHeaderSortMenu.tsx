import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import { Divider, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import React, { useCallback } from 'react';

import { useLocalDbViewSettings } from 'hooks/useLocalDbViewSettings';
import { useViewSortOptions } from 'hooks/useViewSortOptions';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView, ISortOption } from 'lib/focalboard/boardView';
import type { Card } from 'lib/focalboard/card';
import { Constants } from 'lib/focalboard/constants';
import { getPropertyName } from 'lib/focalboard/getPropertyName';

import mutator from '../../mutator';

type Props = {
  properties: readonly IPropertyTemplate[];
  activeView: BoardView;
  orderedCards: Card[];
};
const ViewHeaderSortMenu = React.memo((props: Props) => {
  const { properties, activeView, orderedCards } = props;
  const sortDisplayOptions = properties?.map((o) => ({ id: o.id, name: getPropertyName(o) }));
  sortDisplayOptions?.unshift({ id: Constants.titleColumnId, name: 'Name' });
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
              <ArrowDownwardOutlinedIcon fontSize='small' />
            ) : (
              <ArrowUpwardOutlinedIcon fontSize='small' />
            );
          }
        }
        return (
          <MenuItem key={option.id} id={option.id} onClick={() => sortChanged(option.id)}>
            <ListItemText>{option.name}</ListItemText>
            <ListItemIcon>{rightIcon}</ListItemIcon>
          </MenuItem>
        );
      })}
    </>
  );
});

export default ViewHeaderSortMenu;
