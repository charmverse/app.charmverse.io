
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import '@testing-library/jest-dom';

import type { FilterClause } from '../../blocks/filterClause';
import mutator from '../../mutator';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { mockStateStore, wrapIntl } from '../../testUtils';

import FilterValue from './filterValue';

jest.mock('../../mutator');
const mockedMutator = jest.mocked(mutator, true);

const board = TestBlockFactory.createBoard();
const activeView = TestBlockFactory.createBoardView(board);
const state = {
  users: {
    me: {
      id: 'user-id-1',
      username: 'username_1'
    }
  }
};
const store = mockStateStore([], state);
const filter: FilterClause = {
  propertyId: '1',
  condition: 'includes',
  values: ['Status']
};

describe('components/viewHeader/filterValue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    board.fields.cardProperties[0].options = [{ id: 'Status', value: 'Status', color: '' }];
    activeView.fields.filter.filters = [filter];
  });
  test('return filterValue', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <FilterValue
            view={activeView}
            filter={filter}
            template={board.fields.cardProperties[0]}
          />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', { name: 'menuwrapper' });
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();
  });
  test('return filterValue and click Status', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <FilterValue
            view={activeView}
            filter={filter}
            template={board.fields.cardProperties[0]}
          />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', { name: 'menuwrapper' });
    userEvent.click(buttonElement);
    const switchStatus = screen.getAllByText('Status')[1];
    userEvent.click(switchStatus);
    expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
    expect(container).toMatchSnapshot();
  });
  test('return filterValue and click Status with Status not in filter', () => {
    filter.values = ['test'];
    activeView.fields.filter.filters = [filter];
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <FilterValue
            view={activeView}
            filter={filter}
            template={board.fields.cardProperties[0]}
          />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', { name: 'menuwrapper' });
    userEvent.click(buttonElement);
    const switchStatus = screen.getAllByText('Status')[0];
    userEvent.click(switchStatus);
    expect(mockedMutator.changeViewFilter).toBeCalledTimes(1);
    expect(container).toMatchSnapshot();
  });
});
