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
import { Utils } from '../../utils';

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

const FilterComponent = React.memo((props: Props): JSX.Element => {
  const { activeView, properties } = props;

  const conditionClicked = (optionId: string, filter: FilterClause): void => {
    const filterIndex = activeView.fields.filter.filters.indexOf(filter);
    Utils.assert(filterIndex >= 0, "Can't find filter");

    const filterGroup = createFilterGroup(activeView.fields.filter);
    const newFilter = filterGroup.filters[filterIndex] as FilterClause;

    Utils.assert(newFilter, `No filter at index ${filterIndex}`);
    if (newFilter.condition !== optionId) {
      // newFilter.condition = optionId as FilterCondition;
      mutator.changeViewFilter(activeView.id, activeView.fields.filter, filterGroup);
    }
  };

  const addFilterClicked = () => {
    const filters =
      (activeView.fields.filter?.filters.filter((o) => !isAFilterGroupInstance(o)) as FilterClause[]) || [];

    const filterGroup = createFilterGroup(activeView.fields.filter);

    const filter = createFilterClause({
      condition: 'contains',
      propertyId: Constants.titleColumnId,
      values: [''],
      filterId: v4()
    });

    // Pick the first select property that isn't already filtered on
    const selectProperty = properties
      .filter((o: IPropertyTemplate) => !filters.find((f) => f.propertyId === o.id))
      .find((o: IPropertyTemplate) => o.type === 'select' || o.type === 'multiSelect');
    if (selectProperty) {
      filter.propertyId = selectProperty.id;
    }
    filterGroup.filters.push(filter);

    mutator.changeViewFilter(activeView.id, activeView.fields.filter, filterGroup);
  };

  const filters: FilterClause[] =
    (activeView.fields.filter?.filters.filter((o) => !isAFilterGroupInstance(o)) as FilterClause[]) || [];

  return (
    <StyledFilterComponent>
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

      <Button variant='outlined' color='secondary' size='small' onClick={() => addFilterClicked()}>
        <FormattedMessage id='FilterComponent.add-filter' defaultMessage='+ Add filter' />
      </Button>
    </StyledFilterComponent>
  );
});

export default FilterComponent;
