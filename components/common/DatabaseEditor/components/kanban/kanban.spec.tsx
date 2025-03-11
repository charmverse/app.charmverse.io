import '@testing-library/jest-dom';
import type { PageMeta } from '@charmverse/core/pages';
import { pageStubToCreate } from '@packages/testing/generatePageStub';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import type { BoardGroup, IPropertyOption, IPropertyTemplate } from 'lib/databases/board';

import { mutator } from '../../mutator';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { mockDOM, mockStateStore, wrapDNDIntl } from '../../testUtils';
import { Utils } from '../../utils';

import Kanban from './kanban';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

global.fetch = jest.fn();
jest.mock('../../utils');
const mockedUtils = jest.mocked(Utils, { shallow: true });
const mockedchangePropertyOptionValue = jest.spyOn(mutator, 'changePropertyOptionValue');
const mockedChangeViewCardOrder = jest.spyOn(mutator, 'changeViewCardOrder');

describe('src/component/kanban/kanban', () => {
  const board = TestBlockFactory.createBoard();
  const activeView = TestBlockFactory.createBoardView(board);
  const card1 = TestBlockFactory.createCard(board);
  card1.id = 'id1';
  card1.fields.properties = { id: 'property_value_id_1' };
  const card2 = TestBlockFactory.createCard(board);
  card2.id = 'id2';
  card2.fields.properties = { id: 'property_value_id_1' };
  const card3 = TestBlockFactory.createCard(board);
  card3.id = 'id3';
  card3.fields.properties = { id: 'property_value_id_2' };
  activeView.fields.kanbanCalculations = {
    id1: {
      calculation: 'countEmpty',
      propertyId: '1'
    }
  };
  const optionQ1: IPropertyOption = {
    color: 'propColorOrange',
    id: 'property_value_id_1',
    value: 'Q1'
  };
  const optionQ2: IPropertyOption = {
    color: 'propColorBlue',
    id: 'property_value_id_2',
    value: 'Q2'
  };
  const optionQ3: IPropertyOption = {
    color: 'propColorDefault',
    id: 'property_value_id_3',
    value: 'Q3'
  };

  const groupProperty: IPropertyTemplate = {
    id: 'id',
    name: 'name',
    type: 'text',
    options: [optionQ1, optionQ2]
  };

  const state = {
    cards: {
      cards: [card1, card2, card3]
    },
    contents: {},
    comments: {
      comments: {}
    }
  };
  const store = mockStateStore([], state);
  beforeAll(() => {
    mockDOM();
  });
  beforeEach(jest.resetAllMocks);

  const visibleGroups: BoardGroup[] = [
    {
      id: optionQ1.id,
      option: optionQ1,
      cards: [card1, card2]
    },
    {
      id: optionQ2.id,
      option: optionQ2,
      cards: [card3]
    }
  ];

  const hiddenGroups: BoardGroup[] = [
    {
      id: optionQ3.id,
      option: optionQ3,
      cards: []
    }
  ];

  test('should match snapshot', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Kanban
            board={board}
            activeView={activeView}
            cards={[card1, card2, card3]}
            groupByProperty={groupProperty}
            visibleGroups={visibleGroups}
            hiddenGroups={hiddenGroups}
            selectedCardIds={[]}
            readOnly={false}
            onCardClicked={jest.fn()}
            addCard={jest.fn()}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });

  test('return kanban and drag card to other card ', async () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Kanban
            board={board}
            activeView={activeView}
            cards={[card1, card2]}
            groupByProperty={groupProperty}
            visibleGroups={visibleGroups}
            hiddenGroups={hiddenGroups}
            selectedCardIds={[]}
            readOnly={false}
            onCardClicked={jest.fn()}
            addCard={jest.fn()}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );

    const cardsElement = container.querySelectorAll('.KanbanCard');
    expect(cardsElement).not.toBeNull();
    expect(cardsElement).toHaveLength(3);
    fireEvent.dragStart(cardsElement[0]);
    fireEvent.dragEnter(cardsElement[1]);
    fireEvent.dragOver(cardsElement[1]);
    fireEvent.drop(cardsElement[1]);
    expect(mockedUtils.log).toBeCalled();

    await waitFor(async () => {
      expect(mockedChangeViewCardOrder).toBeCalled();
    });
  });

  test('return kanban and change card column', async () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Kanban
            board={board}
            activeView={activeView}
            cards={[card1, card2]}
            groupByProperty={groupProperty}
            visibleGroups={visibleGroups}
            hiddenGroups={hiddenGroups}
            selectedCardIds={[]}
            readOnly={false}
            onCardClicked={jest.fn()}
            addCard={jest.fn()}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );

    const cardsElement = container.querySelectorAll('.KanbanCard');
    expect(cardsElement).not.toBeNull();
    expect(cardsElement).toHaveLength(3);
    const columnQ2Element = container.querySelector('.octo-board-column:nth-child(2)');
    expect(columnQ2Element).toBeDefined();
    fireEvent.dragStart(cardsElement[0]);
    fireEvent.dragEnter(columnQ2Element!);
    fireEvent.dragOver(columnQ2Element!);
    fireEvent.drop(columnQ2Element!);
    await waitFor(async () => {
      expect(mockedChangeViewCardOrder).toBeCalled();
    });
  });

  test('return kanban and change card column to hidden column', async () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Kanban
            board={board}
            activeView={activeView}
            cards={[card1, card2]}
            groupByProperty={groupProperty}
            visibleGroups={visibleGroups}
            hiddenGroups={hiddenGroups}
            selectedCardIds={[]}
            readOnly={false}
            onCardClicked={jest.fn()}
            addCard={jest.fn()}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );

    const cardsElement = container.querySelectorAll('.KanbanCard');
    expect(cardsElement).not.toBeNull();
    expect(cardsElement).toHaveLength(3);
    const columnQ3Element = container.querySelector('.octo-board-hidden-item');
    expect(columnQ3Element).toBeDefined();
    fireEvent.dragStart(cardsElement[0]!);
    fireEvent.dragEnter(columnQ3Element!);
    fireEvent.dragOver(columnQ3Element!);
    fireEvent.drop(columnQ3Element!);
    await waitFor(async () => {
      expect(mockedChangeViewCardOrder).toBeCalled();
    });
  });

  test('return kanban and click on New', () => {
    const mockedAddCard = jest.fn();
    render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Kanban
            board={board}
            activeView={activeView}
            cards={[card1, card2]}
            groupByProperty={groupProperty}
            visibleGroups={visibleGroups}
            hiddenGroups={hiddenGroups}
            selectedCardIds={[]}
            readOnly={false}
            onCardClicked={jest.fn()}
            addCard={mockedAddCard}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    const allButtonsNew = screen.getAllByRole('button', { name: 'New' });
    expect(allButtonsNew).not.toBeNull();
    userEvent.click(allButtonsNew[0]);
    expect(mockedAddCard).toBeCalledTimes(1);
  });

  test('return kanban and click on KanbanCalculationMenu', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Kanban
            board={board}
            activeView={activeView}
            cards={[card1, card2]}
            groupByProperty={groupProperty}
            visibleGroups={visibleGroups}
            hiddenGroups={hiddenGroups}
            selectedCardIds={[]}
            readOnly={false}
            onCardClicked={jest.fn()}
            addCard={jest.fn()}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    const buttonKanbanCalculation = screen.getByRole('button', { name: '2' });
    expect(buttonKanbanCalculation).toBeDefined();
    userEvent.click(buttonKanbanCalculation!);
    expect(container).toMatchSnapshot();
  });
});
