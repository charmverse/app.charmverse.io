import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, IconButton, ListItemIcon, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { debounce } from 'lodash';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React, { useEffect, useMemo, useState } from 'react';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import { propertyConfigs } from 'lib/focalboard/filterClause';
import type { FilterCondition, FilterClause } from 'lib/focalboard/filterClause';
import { createFilterGroup } from 'lib/focalboard/filterGroup';

import { Constants } from '../../constants';
import mutator from '../../mutator';

import { iconForPropertyType } from './viewHeaderPropertiesMenu';

type Props = {
  properties: IPropertyTemplate[];
  view: BoardView;
  conditionClicked: (condition: FilterCondition, filter: FilterClause) => void;
  filter: FilterClause;
};

function formatCondition(condition: string) {
  const [firstChunk, ...restChunks] = condition.split('-');
  return (
    firstChunk.charAt(0).toUpperCase() +
    firstChunk.slice(1) +
    (restChunks.length !== 0 ? ' ' : '') +
    restChunks.join(' ')
  );
}

function FilterPropertyValue({
  properties,
  filter: initialFilter,
  view
}: {
  view: BoardView;
  filter: FilterClause;
  properties: IPropertyTemplate[];
}) {
  const [filter, setFilter] = useState(initialFilter);
  const propertyRecord = properties.reduce<Record<string, IPropertyTemplate>>((acc, property) => {
    acc[property.id] = property;
    return acc;
  }, {});

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const updatePropertyValueDebounced = useMemo(() => {
    return debounce((_view: BoardView, _filter: FilterClause) => {
      mutator.changeViewFilter(_view.id, _view.fields.filter, {
        operation: 'and',
        filters: [_filter]
      });
    }, 1000);
  }, []);

  const propertyDataType = propertyConfigs[propertyRecord[filter.propertyId].type].datatype;

  if (propertyDataType === 'text' || propertyDataType === 'number') {
    return (
      <TextField
        variant='outlined'
        type={propertyDataType === 'number' ? 'number' : 'text'}
        value={filter.values[0]}
        onChange={(e) => {
          const value = e.target.value;
          const newFilterValue = {
            ...filter,
            values: [value]
          };
          setFilter(newFilterValue);
          updatePropertyValueDebounced(view, newFilterValue);
        }}
        placeholder='Value'
      />
    );
  }

  return null;
}

function FilterEntry(props: Props) {
  const deleteFilterClausePopupState = usePopupState({ variant: 'popover' });
  const { properties: viewProperties, view, filter } = props;
  const containsTitleProperty = viewProperties.find((property) => property.id === Constants.titleColumnId);
  const properties: IPropertyTemplate[] = containsTitleProperty
    ? viewProperties
    : [
        {
          id: Constants.titleColumnId,
          name: 'Title',
          type: 'text',
          options: []
        },
        ...viewProperties
      ];

  const template = properties.find((o: IPropertyTemplate) => o.id === filter.propertyId);

  const key = `${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`;

  function deleteFilterClause() {
    const filterGroup = createFilterGroup(view.fields.filter);
    filterGroup.filters = filterGroup.filters.filter(
      (_filter) => (_filter as FilterClause).filterId !== filter.filterId
    );
    mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
  }

  if (!template) {
    return null;
  }

  return (
    <Stack key={key} gap={0.5} flexDirection='row'>
      <PopupState variant='popover' popupId='view-filter'>
        {(popupState) => (
          <>
            <Button
              color='secondary'
              size='small'
              {...bindTrigger(popupState)}
              variant='outlined'
              endIcon={<KeyboardArrowDownIcon fontSize='small' />}
            >
              <Stack flexDirection='row' alignItems='center'>
                <ListItemIcon>{iconForPropertyType(template.type, { color: 'secondary' })}</ListItemIcon>
                <Typography>{template.name}</Typography>
              </Stack>
            </Button>
            <Menu {...bindMenu(popupState)}>
              {properties.map((property) => (
                <MenuItem
                  key={property.id}
                  id={property.id}
                  onClick={() => {
                    const filterGroup = createFilterGroup(view.fields.filter);
                    const filterClause = filterGroup.filters.find(
                      (_filter) => (_filter as FilterClause).filterId === filter.filterId
                    ) as FilterClause;
                    if (filterClause) {
                      if (filterClause.propertyId !== property.id) {
                        filterClause.propertyId = property.id;
                        filterClause.values = [];
                        filterClause.condition = propertyConfigs[property.type].conditions[0];
                        mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
                      }
                    }
                  }}
                >
                  <ListItemIcon>{iconForPropertyType(property.type)}</ListItemIcon>
                  <Typography>{property.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </PopupState>

      <PopupState variant='popover' popupId='view-filter'>
        {(popupState) => (
          <>
            <Button
              color='secondary'
              size='small'
              {...bindTrigger(popupState)}
              variant='outlined'
              endIcon={<KeyboardArrowDownIcon fontSize='small' />}
            >
              <Typography variant='subtitle1'>{formatCondition(filter.condition)}</Typography>
            </Button>
            <Menu {...bindMenu(popupState)}>
              {propertyConfigs[template.type].conditions.map((condition) => {
                return (
                  <MenuItem key={condition} id='includes' onClick={() => props.conditionClicked(condition, filter)}>
                    <Typography variant='subtitle1' sx={{ whiteSpace: 'nowrap' }}>
                      {formatCondition(condition)}
                    </Typography>
                  </MenuItem>
                );
              })}
            </Menu>
          </>
        )}
      </PopupState>
      <FilterPropertyValue filter={filter} properties={properties} view={view} />
      <div className='octo-spacer' />
      <IconButton size='medium' {...bindTrigger(deleteFilterClausePopupState)}>
        <MoreHorizIcon fontSize='small' />
      </IconButton>
      <Menu {...bindMenu(deleteFilterClausePopupState)}>
        <MenuItem onClick={deleteFilterClause}>
          <DeleteOutlinedIcon fontSize='small' sx={{ mr: 1 }} />
          <Typography>Delete</Typography>
        </MenuItem>
      </Menu>
    </Stack>
  );
}

export default React.memo(FilterEntry);
