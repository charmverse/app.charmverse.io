import styled from '@emotion/styled';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import { Divider, MenuItem, Select, Typography, Stack } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { capitalize } from 'lodash';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { v4 } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { FilterClause, FilterCondition } from 'lib/focalboard/filterClause';
import { createFilterClause } from 'lib/focalboard/filterClause';
import type { FilterGroupOperation } from 'lib/focalboard/filterGroup';
import { createFilterGroup, isAFilterGroupInstance } from 'lib/focalboard/filterGroup';

import { Constants } from '../../constants';
import mutator from '../../mutator';

import FilterEntry from './filterEntry';

type Props = {
  properties: IPropertyTemplate[];
  activeView: BoardView;
};

const StyledFilterComponent = styled(Box)`
  min-width: 560px;
  max-width: 100%;
  padding: 10px;
`;

const FilterComponent = React.memo((props: Props) => {
  const { activeView, properties } = props;

  const conditionClicked = (condition: FilterCondition, filter: FilterClause): void => {
    const filterGroup = createFilterGroup(activeView.fields.filter);
    const filterClause = filterGroup.filters.find(
      (_filter) => (_filter as FilterClause).filterId === filter.filterId
    ) as FilterClause;

    if (filterClause && filterClause.condition !== condition) {
      filterClause.condition = condition;
      mutator.changeViewFilter(activeView.id, activeView.fields.filter, filterGroup);
    }
  };

  const addFilterClicked = () => {
    const filterGroup = createFilterGroup(activeView.fields.filter);

    const filter = createFilterClause({
      condition: 'contains',
      propertyId: Constants.titleColumnId,
      values: [],
      filterId: v4()
    });

    filterGroup.filters.push(filter);
    mutator.changeViewFilter(activeView.id, activeView.fields.filter, filterGroup);
  };

  const deleteFilters = () => {
    mutator.changeViewFilter(activeView.id, activeView.fields.filter, { filters: [], operation: 'and' });
  };

  const filters: FilterClause[] =
    (activeView.fields.filter?.filters.filter((o) => !isAFilterGroupInstance(o)) as FilterClause[]) || [];

  function changeFilterGroupOperation(operation: FilterGroupOperation) {
    const filterGroup = createFilterGroup(activeView.fields.filter);
    filterGroup.operation = operation;
    mutator.changeViewFilter(activeView.id, activeView.fields.filter, filterGroup);
  }

  return (
    <StyledFilterComponent>
      {filters.length !== 0 && (
        <Stack gap={1} my={1}>
          {filters.map((filter, filterIndex) => (
            <Stack
              flexDirection='row'
              gap={1}
              key={`${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`}
              alignItems='center'
            >
              <Stack sx={{ width: 75 }} flexDirection='row' justifyContent='flex-end'>
                {filterIndex === 1 ? (
                  <Select<FilterGroupOperation>
                    size='small'
                    value={activeView.fields.filter.operation}
                    onChange={(e) => changeFilterGroupOperation(e.target.value as FilterGroupOperation)}
                    renderValue={(selected) => <Typography fontSize='small'>{capitalize(selected)}</Typography>}
                  >
                    {['Or', 'And'].map((option) => {
                      return (
                        <MenuItem key={option} value={option.toLowerCase()}>
                          <Typography>{option}</Typography>
                        </MenuItem>
                      );
                    })}
                  </Select>
                ) : (
                  <Typography fontSize='small'>
                    {filterIndex === 0 ? 'Where' : capitalize(activeView.fields.filter.operation)}
                  </Typography>
                )}
              </Stack>
              <FilterEntry
                properties={properties}
                view={activeView}
                conditionClicked={conditionClicked}
                filter={filter}
              />
            </Stack>
          ))}
        </Stack>
      )}

      <Button variant='outlined' color='secondary' size='small' onClick={addFilterClicked} sx={{ mt: 1 }}>
        <FormattedMessage id='FilterComponent.add-filter' defaultMessage='+ Add filter' />
      </Button>
      {filters.length !== 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Button
            variant='outlined'
            color='error'
            startIcon={<DeleteOutlinedIcon fontSize='small' />}
            size='small'
            onClick={deleteFilters}
          >
            <FormattedMessage id='FilterComponent.delete-filter' defaultMessage='Delete filter' />
          </Button>
        </>
      )}
    </StyledFilterComponent>
  );
});

export default FilterComponent;
