
import '@testing-library/jest-dom';
import 'isomorphic-fetch';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { act } from 'react-dom/test-utils';
import { Provider as ReduxProvider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { FetchMock } from '../../test/fetchMock';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl } from '../../testUtils';

import TableRows from './tableRows';

global.fetch = FetchMock.fn;

beforeEach(() => {
  FetchMock.fn.mockReset();
});

describe('components/table/TableRows', () => {
  const board = TestBlockFactory.createBoard();
  const view = TestBlockFactory.createBoardView(board);

  const view2 = TestBlockFactory.createBoardView(board);
  view2.fields.sortOptions = [];

  const card = TestBlockFactory.createCard(board);
  const cardTemplate = TestBlockFactory.createCard(board);
  cardTemplate.fields.isTemplate = true;

  const mockStore = configureStore([]);
  const state = {
    users: {},
    comments: {
      comments: {}
    },
    contents: {
      contents: {}
    },
    cards: {
      cards: {
        [card.id]: card
      },
      templates: {
        [cardTemplate.id]: cardTemplate
      }
    }
  };

  test('should match snapshot, fire events', async () => {
    const callback = jest.fn();
    const addCard = jest.fn();

    const store = mockStore(state);
    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <TableRows
          board={board}
          activeView={view}
          columnRefs={new Map()}
          cards={[card]}
          offset={0}
          resizingColumn=''
          selectedCardIds={[]}
          readOnly={false}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
          onDrop={jest.fn()}
        />
      </ReduxProvider>
    );

    const { container, getByTitle, getByText } = render(<DndProvider backend={HTML5Backend}>{component}</DndProvider>);

    const open = getByText(/Open/i);
    fireEvent.click(open);
    expect(callback).toBeCalled();

    const input = getByTitle(/title/);
    act(() => {
      userEvent.click(input);
      userEvent.keyboard('{enter}');
    });

    expect(addCard).toBeCalled();
    expect(container).toMatchSnapshot();
  });
});
