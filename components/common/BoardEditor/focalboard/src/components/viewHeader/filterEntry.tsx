import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Button, IconButton, ListItemIcon, Menu, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { debounce } from 'lodash';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React, { useEffect, useMemo, useState } from 'react';

import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { FilterClause } from 'lib/focalboard/filterClause';
import { createFilterGroup } from 'lib/focalboard/filterGroup';

import { Constants } from '../../constants';
import mutator from '../../mutator';
import { Utils } from '../../utils';

import { iconForPropertyType } from './viewHeaderPropertiesMenu';

type Props = {
  properties: IPropertyTemplate[];
  view: BoardView;
  conditionClicked: (optionId: string, filter: FilterClause) => void;
  filter: FilterClause;
};

const BooleanDataTypeConditions = ['is', 'is-not'] as const;

const TextDataTypeConditions = [
  'is',
  'is-not',
  'contains',
  'does-not-contain',
  'starts-with',
  'ends-with',
  'is-empty',
  'is-not-empty'
] as const;

const NumberDataTypeConditions = [
  'equal',
  'not-equal',
  'greater-than',
  'less-than',
  'greater-than-equal',
  'less-than-equal',
  'is-empty',
  'is-not-empty'
] as const;

const DateDataTypeConditions = [
  'is',
  'is-not',
  'is-before',
  'is-on-or-before',
  'is-on-or-after',
  'is-between',
  'is-empty',
  'is-not-empty'
] as const;

const MultiSelectDataTypeConditions = ['contains', 'does-not-contain', 'is-empty', 'is-not-empty'] as const;

const SelectDataTypeConditions = ['is', 'is-not', 'is-empty', 'is-not-empty'] as const;

const MiscDataTypeConditions = ['is-empty', 'is-not-empty'] as const;

type DataType = 'text' | 'number' | 'boolean' | 'date' | 'multi-select' | 'select' | 'misc';

type DataTypeFactory<DT extends DataType, DataTypeDataTypeConditions extends readonly string[]> = {
  datatype: DT;
  conditions: readonly DataTypeDataTypeConditions[number][];
};

type BooleanDataTypeConfig = DataTypeFactory<'boolean', typeof BooleanDataTypeConditions>;
type TextDataTypeConfig = DataTypeFactory<'text', typeof TextDataTypeConditions>;
type NumberDataTypeConfig = DataTypeFactory<'number', typeof NumberDataTypeConditions>;
type DateDataTypeConfig = DataTypeFactory<'date', typeof DateDataTypeConditions>;
type MultiSelectDataTypeConfig = DataTypeFactory<'multi-select', typeof MultiSelectDataTypeConditions>;
type SelectDataTypeConfig = DataTypeFactory<'select', typeof SelectDataTypeConditions>;
type MiscDataTypeConfig = DataTypeFactory<'misc', typeof MiscDataTypeConditions>;

type DataTypeConfigs =
  | BooleanDataTypeConfig
  | TextDataTypeConfig
  | NumberDataTypeConfig
  | DateDataTypeConfig
  | MultiSelectDataTypeConfig
  | SelectDataTypeConfig
  | MiscDataTypeConfig;

const propertyConfigs: Record<PropertyType, DataTypeConfigs> = {
  updatedBy: {
    datatype: 'multi-select',
    conditions: MultiSelectDataTypeConditions
  },
  updatedTime: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  checkbox: {
    datatype: 'boolean',
    conditions: BooleanDataTypeConditions
  },
  createdBy: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  createdTime: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  date: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  email: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  },
  file: {
    datatype: 'misc',
    conditions: MiscDataTypeConditions
  },
  multiSelect: {
    datatype: 'multi-select',
    conditions: MultiSelectDataTypeConditions
  },
  number: {
    datatype: 'number',
    conditions: NumberDataTypeConditions
  },
  person: {
    datatype: 'text',
    conditions: MultiSelectDataTypeConditions
  },
  phone: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  },
  select: {
    datatype: 'select',
    conditions: SelectDataTypeConditions
  },
  text: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  },
  url: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  }
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

  if (propertyConfigs[propertyRecord[filter.propertyId].type].datatype === 'text') {
    return (
      <TextField
        variant='outlined'
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

  let displayValue: string;
  if (filter.values.length > 0 && template) {
    displayValue = filter.values
      .map((id) => {
        const option = template.options.find((o) => o.id === id);
        return option?.value || '(Unknown)';
      })
      .join(', ');
  } else {
    displayValue = '(empty)';
  }

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
    <Stack className='FilterEntry' key={key} gap={0.5} flexDirection='row'>
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
                <ListItemIcon>{iconForPropertyType(template.type)}</ListItemIcon>
                <Typography>{template.name}</Typography>
              </Stack>
            </Button>
            <Menu {...bindMenu(popupState)}>
              {properties.map((property) => (
                <MenuItem
                  key={property.id}
                  id={property.id}
                  onClick={() => {
                    const filterIndex = view.fields.filter.filters.indexOf(filter);
                    Utils.assert(filterIndex >= 0, "Can't find filter");
                    const filterGroup = createFilterGroup(view.fields.filter);
                    const newFilter = filterGroup.filters[filterIndex] as FilterClause;
                    Utils.assert(newFilter, `No filter at index ${filterIndex}`);
                    if (newFilter.propertyId !== property.id) {
                      newFilter.propertyId = property.id;
                      newFilter.values = [];
                      mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
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
                    <Typography variant='subtitle1'>{formatCondition(condition)}</Typography>
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
      {/* <Button
        onClick={() => {
          const filterGroup = createFilterGroup(view.fields.filter);
          filterGroup.filters = filterGroup.filters.filter(
            (o) => isAFilterGroupInstance(o) || !areFilterClausesEqual(o, filter)
          );
          mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
        }}
      >
        <DeleteOutlinedIcon fontSize='small' />
      </Button> */}
    </Stack>
  );
}

export default React.memo(FilterEntry);
