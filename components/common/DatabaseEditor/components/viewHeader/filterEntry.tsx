import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import type { SelectChangeEvent } from '@mui/material';
import {
  Button,
  Checkbox,
  Chip,
  ListItemIcon,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { getChainList, getChainById } from '@packages/connectors/chains';
import { debounce } from 'lodash';
import { DateTime } from 'luxon';
import PopupState, { bindMenu, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import React, { useEffect, useMemo, useState } from 'react';

import { UserAndRoleSelect } from 'components/common/DatabaseEditor/components/properties/UserAndRoleSelect';
import { DatePicker } from 'components/common/DatePicker';
import UserDisplay from 'components/common/UserDisplay';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import type { IPropertyTemplate } from 'lib/databases/board';
import { Constants } from 'lib/databases/constants';
import type { FilterClause, FilterCondition } from 'lib/databases/filterClause';
import { propertyConfigs } from 'lib/databases/filterClause';
import type { FilterGroup } from 'lib/databases/filterGroup';
import { createFilterGroup } from 'lib/databases/filterGroup';
import { EVALUATION_STATUS_LABELS, PROPOSAL_STEP_LABELS } from 'lib/databases/proposalDbProperties';
import { AUTHORS_BLOCK_ID, PROPOSAL_REVIEWERS_BLOCK_ID } from 'lib/proposals/blocks/constants';
import type { ProposalEvaluationStatus, ProposalEvaluationStep } from 'lib/proposals/interfaces';
import { REWARD_REVIEWERS_BLOCK_ID } from 'lib/rewards/blocks/constants';
import { slugify } from 'lib/utils/strings';
import { focalboardColorsMap } from 'theme/colors';

import { iconForPropertyType } from '../../widgets/iconForPropertyType';

import { RelatedPagesSelect } from './RelatedPagesSelect';

type Props = {
  properties: IPropertyTemplate[];
  conditionClicked: (condition: FilterCondition, filter: FilterClause) => void;
  filter: FilterClause;
  changeViewFilter: (filterGroup: FilterGroup) => void;
  currentFilter: FilterGroup;
};

function formatCondition(condition: string) {
  const [firstChunk, ...restChunks] = condition.split('_');
  return (
    firstChunk.charAt(0).toUpperCase() +
    firstChunk.slice(1) +
    (restChunks.length !== 0 ? ' ' : '') +
    restChunks.join(' ')
  );
}

const SelectMenuItemsContainer = styled(Stack)`
  flex-direction: row;
  gap: ${({ theme }) => theme.spacing(1)};
  max-width: 350px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;

const EllipsisText = styled(Typography)`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${({ theme }) => theme.palette.text.primary};
`;

function FilterPropertyValue({
  properties,
  filter: initialFilter,
  changeViewFilter,
  currentFilter
}: {
  filter: FilterClause;
  properties: IPropertyTemplate[];
  changeViewFilter: (filterGroup: FilterGroup) => void;
  currentFilter: FilterGroup;
}) {
  const [filter, setFilter] = useState(initialFilter);
  const { space } = useCurrentSpace();

  const propertyRecord = properties.reduce<Record<string, IPropertyTemplate>>((acc, property) => {
    acc[property.id] = property;
    return acc;
  }, {});
  const { members } = useMembers();
  const isPropertyTypePerson =
    propertyRecord[filter.propertyId].type.match(/person|createdBy|updatedBy|proposalEvaluatedBy|proposalAuthor/) ||
    filter.propertyId === PROPOSAL_REVIEWERS_BLOCK_ID ||
    filter.propertyId === AUTHORS_BLOCK_ID;
  const isPropertyTypeEvaluationType = propertyRecord[filter.propertyId].type === 'proposalEvaluationType';
  const isPropertyTypeTokenChain = propertyRecord[filter.propertyId].type === 'tokenChain';
  const property = propertyRecord[filter.propertyId];

  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  const updatePropertyValueDebounced = useMemo(() => {
    return debounce((_currentFilter: FilterGroup, _filter: FilterClause) => {
      const filterIndex = currentFilter.filters.findIndex(
        (__filter) => (__filter as FilterClause).filterId === filter.filterId
      );
      if (filterIndex > -1) {
        const filters = [..._currentFilter.filters];
        filters[filterIndex] = _filter;
        changeViewFilter({
          operation: _currentFilter.operation,
          filters
        });
      }
    }, 100);
  }, [changeViewFilter, currentFilter.filters, filter.filterId]);

  const updateTextValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newFilterValue = {
      ...filter,
      values: [value]
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(currentFilter, newFilterValue);
  };

  const updateBooleanValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.checked;
    const newFilterValue = {
      ...filter,
      values: [value ? 'true' : '']
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(currentFilter, newFilterValue);
  };

  const updateMultiSelectValue = (e: SelectChangeEvent<string[]>) => {
    const values = e.target.value as string[];
    const newFilterValue = {
      ...filter,
      values
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(currentFilter, newFilterValue);
  };

  const updateMultiSelect = (values: string[]) => {
    const newFilterValue = {
      ...filter,
      values
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(currentFilter, newFilterValue);
  };

  const updateSelectValue = (value: string) => {
    const currentValue = filter.values[0];
    const newFilterValue = {
      ...filter,
      values: currentValue === value ? [] : [value]
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(currentFilter, newFilterValue);
  };

  const updateDateValue = (date: DateTime | null) => {
    const newFilterValue = {
      ...filter,
      values: date ? [date.toJSDate().getTime().toString()] : []
    };
    setFilter(newFilterValue);
    updatePropertyValueDebounced(currentFilter, newFilterValue);
  };

  const propertyDataType =
    REWARD_REVIEWERS_BLOCK_ID === filter.propertyId
      ? 'user_roles'
      : propertyConfigs[propertyRecord[filter.propertyId].type].datatype;

  if (filter.condition === 'is_empty' || filter.condition === 'is_not_empty') {
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
        inputProps={{
          sx: {
            fontSize: 'small'
          }
        }}
      />
    );
  } else if (propertyDataType === 'boolean') {
    return <Checkbox checked={filter.values[0] === 'true'} onChange={updateBooleanValue} />;
  } else if (propertyDataType === 'user_roles') {
    return (
      <UserAndRoleSelect
        onChange={async (values) => {
          updateMultiSelect(values.map((value) => value.id));
        }}
        value={filter.values}
      />
    );
  } else if (propertyDataType === 'multi_select') {
    if (isPropertyTypePerson) {
      return (
        <Select<string[]>
          size='small'
          multiple
          displayEmpty
          value={filter.values}
          onChange={updateMultiSelectValue}
          renderValue={(selectedMemberIds) => {
            return selectedMemberIds.length === 0 ? (
              <Typography color='secondary' fontSize='small'>
                Select a person
              </Typography>
            ) : (
              <SelectMenuItemsContainer>
                {selectedMemberIds.map((selectedMemberId) => {
                  const member = members?.find((_member) => _member.id === selectedMemberId);
                  return member ? (
                    <UserDisplay key={selectedMemberId} avatarSize='xSmall' fontSize={12} userId={member.id} />
                  ) : null;
                })}
              </SelectMenuItemsContainer>
            );
          }}
        >
          {members.map((member) => {
            return (
              <MenuItem value={member.id} key={member.id}>
                <UserDisplay userId={member.id} />
              </MenuItem>
            );
          })}
        </Select>
      );
    } else if (isPropertyTypeTokenChain) {
      const chainOptions = getChainList({ enableTestnets: !!space?.enableTestnets });
      return (
        <Select<string[]>
          size='small'
          multiple
          displayEmpty
          value={filter.values}
          onChange={updateMultiSelectValue}
          renderValue={(chainIds) => {
            return chainIds.length === 0 ? (
              <Typography color='secondary' fontSize='small'>
                Select a blockchain
              </Typography>
            ) : (
              <SelectMenuItemsContainer>
                {chainIds.map((chainId) => {
                  const chain = getChainById(parseInt(chainId, 10));
                  return <Chip key={chainId} size='small' label={chain?.chainName} />;
                })}
              </SelectMenuItemsContainer>
            );
          }}
        >
          {chainOptions.map((chain) => {
            return (
              <MenuItem value={chain.chainId.toString()} key={chain.chainId}>
                <Chip size='small' label={chain.chainName} />
              </MenuItem>
            );
          })}
        </Select>
      );
    } else if (property.type === 'relation') {
      return (
        <RelatedPagesSelect
          value={filter.values}
          boardPageId={property.relationData?.boardId}
          onChange={updateMultiSelect}
        />
      );
    } else {
      return (
        <Select<string[]>
          size='small'
          multiple
          displayEmpty
          value={filter.values}
          onChange={updateMultiSelectValue}
          renderValue={(selected) => {
            return selected.length === 0 ? (
              <Typography fontSize='small' color='secondary'>
                Select an option
              </Typography>
            ) : (
              <SelectMenuItemsContainer>
                {selected.map((optionId) => {
                  const foundOption = property.options?.find((o) => o.id === optionId);
                  return foundOption ? (
                    <Chip
                      key={foundOption.id}
                      size='small'
                      label={
                        property.type === 'proposalStatus'
                          ? EVALUATION_STATUS_LABELS[foundOption.value as ProposalEvaluationStatus]
                          : foundOption.value
                      }
                      color={focalboardColorsMap[foundOption.color]}
                    />
                  ) : null;
                })}
              </SelectMenuItemsContainer>
            );
          }}
        >
          {property.options.length === 0 ? (
            <Typography sx={{ mx: 1, textAlign: 'center' }} color='secondary' variant='subtitle1'>
              No options available
            </Typography>
          ) : (
            property.options?.map((option) => {
              return (
                <MenuItem key={option.id} value={option.id}>
                  <Chip
                    size='small'
                    label={
                      property.type === 'proposalStatus'
                        ? EVALUATION_STATUS_LABELS[option.value as ProposalEvaluationStatus]
                        : option.value
                    }
                    color={focalboardColorsMap[option.color]}
                  />
                </MenuItem>
              );
            })
          )}
        </Select>
      );
    }
  } else if (propertyDataType === 'select') {
    return (
      <Select<string>
        displayEmpty
        value={filter.values[0] || ''}
        renderValue={(selected) => {
          const foundOption = property.options?.find((o) => o.id === selected);
          return foundOption ? (
            <Chip
              data-test='filter-type-select'
              size='small'
              label={
                isPropertyTypeEvaluationType
                  ? PROPOSAL_STEP_LABELS[foundOption.value as ProposalEvaluationStep]
                  : foundOption.value
              }
              color={focalboardColorsMap[foundOption.color]}
            />
          ) : (
            <Typography data-test='filter-type-select' fontSize='small' color='secondary'>
              Select an option
            </Typography>
          );
        }}
      >
        {property.options.length === 0 ? (
          <Typography sx={{ mx: 1, textAlign: 'center' }} color='secondary' variant='subtitle1'>
            No options available
          </Typography>
        ) : (
          property.options.map((option) => {
            return (
              <MenuItem
                data-test={`filter-option-value-${option.id}`}
                key={option.id}
                onClick={() => updateSelectValue(option.id)}
                value={option.id}
              >
                <Chip
                  size='small'
                  label={
                    isPropertyTypeEvaluationType
                      ? PROPOSAL_STEP_LABELS[option.value as ProposalEvaluationStep]
                      : option.value
                  }
                  color={focalboardColorsMap[option.color]}
                />
              </MenuItem>
            );
          })
        )}
      </Select>
    );
  } else if (propertyDataType === 'date') {
    return (
      <DatePicker
        value={DateTime.fromMillis(parseInt(filter.values[0]))}
        onChange={updateDateValue}
        slotProps={{
          textField: {
            placeholder: 'Select a date',
            inputProps: {
              sx: { fontSize: 'small' }
            }
          }
        }}
      />
    );
  }

  return null;
}

function FilterEntry(props: Props) {
  const deleteFilterClausePopupState = usePopupState({ variant: 'popover' });
  const { properties: viewProperties, filter, changeViewFilter, currentFilter } = props;
  const containsTitleProperty = viewProperties.find((property) => property.id === Constants.titleColumnId);
  const properties: IPropertyTemplate[] = (
    containsTitleProperty
      ? viewProperties
      : [
          {
            id: Constants.titleColumnId,
            name: 'Title',
            type: 'text',
            options: []
          },
          ...viewProperties
        ]
  ).filter((prop) => prop.type !== 'proposalReviewerNotes') as IPropertyTemplate[];

  const template = properties.find((o: IPropertyTemplate) => o.id === filter.propertyId);

  function deleteFilterClause() {
    const filterGroup = createFilterGroup(currentFilter);
    filterGroup.filters = filterGroup.filters.filter(
      (_filter) => (_filter as FilterClause).filterId !== filter.filterId
    );
    changeViewFilter(filterGroup);
  }

  if (!template) {
    return null;
  }

  return (
    <Stack flexDirection='row' justifyContent='space-between' flex={1}>
      <Stack gap={0.5} flexDirection='row' width='100%'>
        <PopupState variant='popover' popupId='view-filter'>
          {(popupState) => (
            <>
              <Button
                color='secondary'
                size='small'
                variant='outlined'
                data-test='filter-property-button'
                endIcon={<KeyboardArrowDownIcon fontSize='small' />}
                sx={{ minWidth: 125, maxWidth: 125, width: 125, justifyContent: 'space-between' }}
                {...bindTrigger(popupState)}
              >
                <Stack
                  flexDirection='row'
                  gap={0.5}
                  alignItems='center'
                  sx={{ whiteSpace: 'nowrap', overflow: 'hidden' }}
                >
                  {iconForPropertyType(template.type, { color: 'secondary' })}
                  <EllipsisText fontSize='small'>{template.name}</EllipsisText>
                </Stack>
              </Button>
              <Menu {...bindMenu(popupState)} sx={{ maxWidth: 350 }}>
                {properties.map((property) => (
                  <MenuItem
                    key={property.id}
                    id={property.id}
                    selected={property.id === filter.propertyId}
                    data-test={`filter-property-select-${slugify(property.name)}`}
                    onClick={() => {
                      const filterGroup = createFilterGroup(currentFilter);
                      const filterClause = filterGroup.filters.find(
                        (_filter) => (_filter as FilterClause).filterId === filter.filterId
                      ) as FilterClause;
                      if (filterClause) {
                        if (filterClause.propertyId !== property.id) {
                          filterClause.propertyId = property.id;
                          filterClause.values = [];
                          filterClause.condition = propertyConfigs[property.type].conditions[0];
                          changeViewFilter(filterGroup);
                        }
                      }
                    }}
                  >
                    <ListItemIcon>{iconForPropertyType(property.type)}</ListItemIcon>
                    <EllipsisText fontSize='small'>{property.name}</EllipsisText>
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
                data-test='filter-condition-button'
                endIcon={<KeyboardArrowDownIcon fontSize='small' />}
              >
                <EllipsisText fontSize='small' variant='subtitle1'>
                  {formatCondition(filter.condition)}
                </EllipsisText>
              </Button>
              <Menu {...bindMenu(popupState)}>
                {propertyConfigs[template.type].conditions.map((condition) => {
                  return (
                    <MenuItem
                      data-test={`filter-condition-option-${condition}`}
                      selected={condition === filter.condition}
                      key={condition}
                      id='includes'
                      onClick={() => {
                        props.conditionClicked(condition, filter);
                        popupState.close();
                      }}
                    >
                      <EllipsisText variant='subtitle1'>{formatCondition(condition)}</EllipsisText>
                    </MenuItem>
                  );
                })}
              </Menu>
            </>
          )}
        </PopupState>
        <FilterPropertyValue
          filter={filter}
          properties={properties}
          changeViewFilter={changeViewFilter}
          currentFilter={currentFilter}
        />
      </Stack>
      <MoreHorizIcon
        sx={{
          cursor: 'pointer',
          alignSelf: 'center',
          justifySelf: 'flex-end',
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
