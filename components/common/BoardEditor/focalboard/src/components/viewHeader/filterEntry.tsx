import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { SelectChangeEvent } from '@mui/material';
import {
  Button,
  Chip,
  ListItemIcon,
  Menu,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { debounce } from 'lodash';
import type { DateTime } from 'luxon';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React, { useEffect, useMemo, useState } from 'react';

import UserDisplay from 'components/common/UserDisplay';
import { useMembers } from 'hooks/useMembers';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { FilterClause, FilterCondition } from 'lib/focalboard/filterClause';
import { propertyConfigs } from 'lib/focalboard/filterClause';
import { createFilterGroup } from 'lib/focalboard/filterGroup';
import { focalboardColorsMap, type SupportedColor } from 'theme/colors';

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
  const { members } = useMembers();
  const isPropertyTypePerson = propertyRecord[filter.propertyId].type.match(/person|createdBy|updatedBy/);
  const isPropertyTypeMultiSelect = propertyRecord[filter.propertyId].type === 'multiSelect';
  const property = propertyRecord[filter.propertyId];

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

  const updateTextValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newFilterValue = {
      ...filter,
      values: [value]
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(view, newFilterValue);
  };

  const updateBooleanValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    const newFilterValue = {
      ...filter,
      values: [value ? 'true' : 'false']
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(view, newFilterValue);
  };

  const updateMultiSelectValue = (e: SelectChangeEvent<string[]>) => {
    const values = e.target.value as string[];
    const newFilterValue = {
      ...filter,
      values
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(view, newFilterValue);
  };

  const updateSelectValue = (e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    const newFilterValue = {
      ...filter,
      values: [value]
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(view, newFilterValue);
  };

  const updateDateValue = (date: DateTime | null) => {
    const newFilterValue = {
      ...filter,
      values: date ? [date.toJSDate().getTime().toString()] : []
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(view, newFilterValue);
  };

  const propertyDataType = propertyConfigs[propertyRecord[filter.propertyId].type].datatype;

  if (filter.condition === 'is-empty' || filter.condition === 'is-not-empty') {
    return null;
  }

  if (propertyDataType === 'text' || propertyDataType === 'number') {
    return (
      <TextField
        variant='outlined'
        type={propertyDataType === 'number' ? 'number' : 'text'}
        value={filter.values[0]}
        onChange={updateTextValue}
        placeholder='Value'
      />
    );
  } else if (propertyDataType === 'boolean') {
    return <Switch checked={filter.values[0] === 'true'} onChange={updateBooleanValue} />;
  } else if (propertyDataType === 'multi-select') {
    if (isPropertyTypeMultiSelect) {
      return (
        <Select<string[]>
          multiple
          value={filter.values}
          onChange={updateMultiSelectValue}
          renderValue={(selected) =>
            selected.map((optionId) => {
              const foundOption = property.options?.find((o) => o.id === optionId);
              return foundOption ? (
                <Chip size='small' label={foundOption.value} color={focalboardColorsMap[foundOption.color]} />
              ) : null;
            })
          }
        >
          {property.options?.map((option) => {
            return (
              <MenuItem key={option.id} value={option.id}>
                <Chip size='small' label={option.value} color={focalboardColorsMap[option.color]} />
              </MenuItem>
            );
          })}
        </Select>
      );
    } else if (isPropertyTypePerson) {
      return (
        <Select<string[]>
          multiple
          value={filter.values}
          onChange={updateMultiSelectValue}
          renderValue={(selectedMemberIds) =>
            selectedMemberIds.map((selectedMemberId) => {
              const member = members?.find((_member) => _member.id === selectedMemberId);
              return member ? (
                <UserDisplay key={selectedMemberId} avatarSize='xSmall' fontSize={12} user={member} />
              ) : null;
            })
          }
        >
          {members.map((member) => {
            return (
              <MenuItem value={member.id} key={member.id}>
                <UserDisplay user={member} />
              </MenuItem>
            );
          })}
        </Select>
      );
    }
  } else if (propertyDataType === 'select') {
    return (
      <Select<string>
        value={filter.values[0]}
        onChange={updateSelectValue}
        renderValue={(selected) => {
          const foundOption = property.options?.find((o) => o.id === selected);
          return foundOption ? (
            <Chip size='small' label={foundOption.value} color={focalboardColorsMap[foundOption.color]} />
          ) : null;
        }}
      >
        {property.options?.map((option) => {
          return (
            <MenuItem key={option.id} value={option.id}>
              <Chip size='small' label={option.value} color={focalboardColorsMap[option.color]} />
            </MenuItem>
          );
        })}
      </Select>
    );
  } else if (propertyDataType === 'date') {
    return (
      <DateTimePicker
        value={new Date(Number(filter.values[0]))}
        onChange={updateDateValue}
        renderInput={(props) => (
          <TextField
            {...props}
            inputProps={{
              ...props.inputProps,
              readOnly: true
            }}
            disabled
            fullWidth
          />
        )}
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
    <Stack flexDirection='row' justifyContent='space-between'>
      <Stack gap={0.5} flexDirection='row'>
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
                  <Typography sx={{ whiteSpace: 'nowrap' }}>{template.name}</Typography>
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
                <Typography variant='subtitle1' sx={{ whiteSpace: 'nowrap' }}>
                  {formatCondition(filter.condition)}
                </Typography>
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
      </Stack>
      <MoreHorizIcon
        sx={{
          cursor: 'pointer',
          alignSelf: 'center',
          mx: 1
        }}
        fontSize='small'
        {...bindTrigger(deleteFilterClausePopupState)}
      />
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
