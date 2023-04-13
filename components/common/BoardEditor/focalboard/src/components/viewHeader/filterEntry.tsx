import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, Button, ListItemIcon, Menu, MenuItem, Popover, Stack, Typography } from '@mui/material';
import PopupState, { bindMenu, bindPopover, bindTrigger } from 'material-ui-popup-state';
import React from 'react';
import { useIntl } from 'react-intl';

import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { FilterClause } from 'lib/focalboard/filterClause';
import { areEqual as areFilterClausesEqual } from 'lib/focalboard/filterClause';
import { createFilterGroup, isAFilterGroupInstance } from 'lib/focalboard/filterGroup';

import { Constants } from '../../constants';
import mutator from '../../mutator';
import { OctoUtils } from '../../octoUtils';
import { Utils } from '../../utils';
import SwitchOption from '../../widgets/menu/switchOption';

import { iconForPropertyType } from './viewHeaderPropertiesMenu';

type Props = {
  properties: IPropertyTemplate[];
  view: BoardView;
  conditionClicked: (optionId: string, filter: FilterClause) => void;
  filter: FilterClause;
};

const BooleanDataTypeConditions = ['is', 'is-not'] as const;

const StringDataTypeConditions = [
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

type DataType = 'string' | 'number' | 'boolean' | 'date' | 'multi-select' | 'select' | 'misc';

type DataTypeFactory<DT extends DataType, DataTypeDataTypeConditions extends readonly string[]> = {
  datatype: DT;
  conditions: readonly DataTypeDataTypeConditions[number][];
};

type BooleanDataTypeConfig = DataTypeFactory<'boolean', typeof BooleanDataTypeConditions>;
type StringDataTypeConfig = DataTypeFactory<'string', typeof StringDataTypeConditions>;
type NumberDataTypeConfig = DataTypeFactory<'number', typeof NumberDataTypeConditions>;
type DateDataTypeConfig = DataTypeFactory<'date', typeof DateDataTypeConditions>;
type MultiSelectDataTypeConfig = DataTypeFactory<'multi-select', typeof MultiSelectDataTypeConditions>;
type SelectDataTypeConfig = DataTypeFactory<'select', typeof SelectDataTypeConditions>;
type MiscDataTypeConfig = DataTypeFactory<'misc', typeof MiscDataTypeConditions>;

type DataTypeConfigs =
  | BooleanDataTypeConfig
  | StringDataTypeConfig
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
    datatype: 'string',
    conditions: StringDataTypeConditions
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
    datatype: 'string',
    conditions: MultiSelectDataTypeConditions
  },
  phone: {
    datatype: 'string',
    conditions: StringDataTypeConditions
  },
  select: {
    datatype: 'select',
    conditions: SelectDataTypeConditions
  },
  text: {
    datatype: 'string',
    conditions: StringDataTypeConditions
  },
  url: {
    datatype: 'string',
    conditions: StringDataTypeConditions
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

function FilterEntry(props: Props) {
  const { properties: viewProperties, view, filter } = props;
  const intl = useIntl();
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

      {(filter.condition === 'includes' || filter.condition === 'notIncludes') && (
        <PopupState variant='popover' popupId='view-filter-value'>
          {(popupState) => (
            <>
              <Button {...bindTrigger(popupState)}>{displayValue}</Button>
              <Popover
                {...bindPopover(popupState)}
                PaperProps={{
                  sx: {
                    overflow: 'visible'
                  }
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                {template?.options.map((o) => (
                  <Box
                    key={o.id}
                    py={1}
                    sx={{
                      background: 'rgb(var(--center-channel-bg-rgb))',
                      '& > div': { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
                      '& .Switch': { mx: 1 },
                      '& .menu-name': { ml: 1 }
                    }}
                  >
                    <SwitchOption
                      id={o.id}
                      name={o.value}
                      isOn={filter.values.includes(o.id)}
                      onClick={() => {
                        const filterIndex = view.fields.filter.filters.indexOf(filter);
                        Utils.assert(filterIndex >= 0, "Can't find filter");

                        const filterGroup = createFilterGroup(view.fields.filter);
                        const newFilter = filterGroup.filters[filterIndex] as FilterClause;
                        Utils.assert(newFilter, `No filter at index ${filterIndex}`);
                        if (filter.values.includes(o.id)) {
                          newFilter.values = newFilter.values.filter((id) => id !== o.id);
                          mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
                        } else {
                          newFilter.values.push(o.id);
                          mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
                        }
                      }}
                    />
                  </Box>
                ))}
              </Popover>
            </>
          )}
        </PopupState>
      )}
      <div className='octo-spacer' />
      <Button
        onClick={() => {
          const filterGroup = createFilterGroup(view.fields.filter);
          filterGroup.filters = filterGroup.filters.filter(
            (o) => isAFilterGroupInstance(o) || !areFilterClausesEqual(o, filter)
          );
          mutator.changeViewFilter(view.id, view.fields.filter, filterGroup);
        }}
      >
        <DeleteOutlinedIcon fontSize='small' />
      </Button>
    </Stack>
  );
}

export default React.memo(FilterEntry);
