import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Stack } from '@mui/system';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { v4 } from 'uuid';

import type { IPropertyTemplate } from 'lib/focalboard/board';
import type { BoardView } from 'lib/focalboard/boardView';
import type { FilterClause, FilterCondition } from 'lib/focalboard/filterClause';
import { createFilterClause } from 'lib/focalboard/filterClause';
import { createFilterGroup, isAFilterGroupInstance } from 'lib/focalboard/filterGroup';

import { Constants } from '../../constants';
import mutator from '../../mutator';

import FilterEntry from './filterEntry';

type Props = {
  properties: IPropertyTemplate[];
  activeView: BoardView;
};

const StyledFilterComponent = styled(Box)`
  color: var(--secondary-text);
  min-width: 430px;
  padding: 10px;

  ${({ theme }) => theme.breakpoints.down('sm')} {
    min-width: 350px;
  }
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

  const filters: FilterClause[] =
    (activeView.fields.filter?.filters.filter((o) => !isAFilterGroupInstance(o)) as FilterClause[]) || [];

  return (
    <StyledFilterComponent>
      {filters.length !== 0 && (
        <Stack gap={1} my={1}>
          {filters.map((filter) => (
            <FilterEntry
              key={`${filter.propertyId}-${filter.condition}-${filter.values.join(',')}`}
              properties={properties}
              view={activeView}
              conditionClicked={conditionClicked}
              filter={filter}
            />
          ))}
        </Stack>
      )}

      <Button variant='outlined' color='secondary' size='small' onClick={() => addFilterClicked()}>
        <FormattedMessage id='FilterComponent.add-filter' defaultMessage='+ Add filter' />
      </Button>
    </StyledFilterComponent>
  );
});

export default FilterComponent;
