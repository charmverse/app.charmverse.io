
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import configureStore from 'redux-mock-store';

import 'isomorphic-fetch';

import type { BoardView } from '../../blocks/boardView';
import { FetchMock } from '../../test/fetchMock';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl } from '../../testUtils';
import type { IUser } from '../../user';
import { Utils, IDType } from '../../utils';

import Table from './table';

global.fetch = FetchMock.fn;

beforeEach(() => {
  FetchMock.fn.mockReset();
});

describe('components/table/Table', () => {
  const board = TestBlockFactory.createBoard();
  const view = TestBlockFactory.createBoardView(board);
  view.fields.viewType = 'table';
  view.fields.groupById = undefined;
  view.fields.visiblePropertyIds = ['property1', 'property2'];

  const view2 = TestBlockFactory.createBoardView(board);
  view2.fields.sortOptions = [];

  const card = TestBlockFactory.createCard(board);
  const cardTemplate = TestBlockFactory.createCard(board);
  cardTemplate.fields.isTemplate = true;

  const state = {
    users: {
      workspaceUsers: {
        'user-id-1': { username: 'username_1' } as IUser,
        'user-id-2': { username: 'username_2' } as IUser,
        'user-id-3': { username: 'username_3' } as IUser,
        'user-id-4': { username: 'username_4' } as IUser
      }
    },
    comments: {
      comments: {}
    },
    contents: {
      contents: {}
    },
    cards: {
      cards: {
        [card.id]: card
      }
    }
  };

  test('should match snapshot', async () => {
    const callback = jest.fn();
    const addCard = jest.fn();

    const mockStore = configureStore([]);
    const store = mockStore(state);

    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <Table
          board={board}
          activeView={view}
          visibleGroups={[]}
          cards={[card]}
          views={[view, view2]}
          selectedCardIds={[]}
          readOnly={false}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot, read-only', async () => {
    const callback = jest.fn();
    const addCard = jest.fn();

    const mockStore = configureStore([]);
    const store = mockStore(state);

    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <Table
          board={board}
          activeView={view}
          visibleGroups={[]}
          cards={[card]}
          views={[view, view2]}
          selectedCardIds={[]}
          readOnly={true}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
        />
      </ReduxProvider>
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot with GroupBy', async () => {
    const callback = jest.fn();
    const addCard = jest.fn();

    const mockStore = configureStore([]);
    const store = mockStore(state);

    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <Table
          board={board}
          activeView={{ ...view, fields: { ...view.fields, groupById: 'property1' } } as BoardView}
          visibleGroups={[{ option: { id: '', value: 'test', color: '' }, cards: [] }]}
          groupByProperty={{
            id: '',
            name: 'Property 1',
            type: 'text',
            options: [{ id: 'property1', value: 'Property 1', color: '' }]
          }}
          cards={[card]}
          views={[view, view2]}
          selectedCardIds={[]}
          readOnly={false}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});

describe('components/table/Table extended', () => {
  const state = {
    users: {
      workspaceUsers: {
        'user-id-1': { username: 'username_1' } as IUser,
        'user-id-2': { username: 'username_2' } as IUser,
        'user-id-3': { username: 'username_3' } as IUser,
        'user-id-4': { username: 'username_4' } as IUser
      }
    },
    comments: {
      comments: {}
    },
    contents: {
      contents: {}
    },
    cards: {
      cards: {}
    }
  };

  test('should match snapshot with CreatedBy', async () => {
    const board = TestBlockFactory.createBoard();

    const dateCreatedId = Utils.createGuid(IDType.User);
    board.fields.cardProperties.push({
      id: dateCreatedId,
      name: 'Date Created',
      type: 'createdTime',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.createdAt = Date.parse('15 Jun 2021 16:22:00');

    const card2 = TestBlockFactory.createCard(board);
    card2.createdAt = Date.parse('15 Jun 2021 16:22:00');

    const view = TestBlockFactory.createBoardView(board);
    view.fields.viewType = 'table';
    view.fields.groupById = undefined;
    view.fields.visiblePropertyIds = ['property1', 'property2', dateCreatedId];

    const callback = jest.fn();
    const addCard = jest.fn();

    const mockStore = configureStore([]);
    const store = mockStore({
      ...state,
      cards: {
        cards: {
          [card1.id]: card1,
          [card2.id]: card2
        }
      }
    });

    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <Table
          board={board}
          activeView={view}
          visibleGroups={[]}
          cards={[card1, card2]}
          views={[view]}
          selectedCardIds={[]}
          readOnly={false}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot with UpdatedAt', async () => {
    const board = TestBlockFactory.createBoard();

    const dateUpdatedId = Utils.createGuid(IDType.User);
    board.fields.cardProperties.push({
      id: dateUpdatedId,
      name: 'Date Updated',
      type: 'updatedTime',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.updatedAt = Date.parse('20 Jun 2021 12:22:00');

    const card2 = TestBlockFactory.createCard(board);
    card2.updatedAt = Date.parse('20 Jun 2021 12:22:00');

    const card2Comment = TestBlockFactory.createCard(board);
    card2Comment.parentId = card2.id;
    card2Comment.type = 'comment';
    card2Comment.updatedAt = Date.parse('21 Jun 2021 15:23:00');

    const card2Text = TestBlockFactory.createCard(board);
    card2Text.parentId = card2.id;
    card2Text.type = 'text';
    card2Text.updatedAt = Date.parse('22 Jun 2021 11:23:00');

    card2.fields.contentOrder = [card2Text.id];

    const view = TestBlockFactory.createBoardView(board);
    view.fields.viewType = 'table';
    view.fields.groupById = undefined;
    view.fields.visiblePropertyIds = ['property1', 'property2', dateUpdatedId];

    const callback = jest.fn();
    const addCard = jest.fn();

    const mockStore = configureStore([]);
    const store = mockStore({
      ...state,
      comments: {
        comments: {
          [card2Comment.id]: card2Comment
        }
      },
      contents: {
        contents: {
          [card2Text.id]: card2Text
        }
      },
      cards: {
        cards: {
          [card1.id]: card1,
          [card2.id]: card2
        }
      }
    });

    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <Table
          board={board}
          activeView={view}
          visibleGroups={[]}
          cards={[card1, card2]}
          views={[view]}
          selectedCardIds={[]}
          readOnly={false}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot with CreatedBy', async () => {
    const board = TestBlockFactory.createBoard();

    const createdById = Utils.createGuid(IDType.User);
    board.fields.cardProperties.push({
      id: createdById,
      name: 'Created By',
      type: 'createdBy',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.createdBy = 'user-id-1';

    const card2 = TestBlockFactory.createCard(board);
    card2.createdBy = 'user-id-2';

    const view = TestBlockFactory.createBoardView(board);
    view.fields.viewType = 'table';
    view.fields.groupById = undefined;
    view.fields.visiblePropertyIds = ['property1', 'property2', createdById];

    const callback = jest.fn();
    const addCard = jest.fn();

    const mockStore = configureStore([]);
    const store = mockStore({
      ...state,
      cards: {
        cards: {
          [card1.id]: card1,
          [card2.id]: card2
        }
      }
    });

    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <Table
          board={board}
          activeView={view}
          visibleGroups={[]}
          cards={[card1, card2]}
          views={[view]}
          selectedCardIds={[]}
          readOnly={false}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
        />
      </ReduxProvider>
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot with UpdatedBy', async () => {
    const board = TestBlockFactory.createBoard();

    const updatedById = Utils.createGuid(IDType.User);
    board.fields.cardProperties.push({
      id: updatedById,
      name: 'Last Modified By',
      type: 'updatedBy',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.updatedBy = 'user-id-1';
    card1.updatedAt = Date.parse('15 Jun 2021 16:22:00');

    const card1Text = TestBlockFactory.createCard(board);
    card1Text.parentId = card1.id;
    card1Text.type = 'text';
    card1Text.updatedBy = 'user-id-4';
    card1Text.updatedAt = Date.parse('16 Jun 2021 16:22:00');

    card1.fields.contentOrder = [card1Text.id];

    const card2 = TestBlockFactory.createCard(board);
    card2.updatedBy = 'user-id-2';
    card2.updatedAt = Date.parse('15 Jun 2021 16:22:00');

    const card2Comment = TestBlockFactory.createCard(board);
    card2Comment.parentId = card2.id;
    card2Comment.type = 'comment';
    card2Comment.updatedBy = 'user-id-3';
    card2.updatedAt = Date.parse('16 Jun 2021 16:22:00');

    const view = TestBlockFactory.createBoardView(board);
    view.fields.viewType = 'table';
    view.fields.groupById = undefined;
    view.fields.visiblePropertyIds = ['property1', 'property2', updatedById];

    const callback = jest.fn();
    const addCard = jest.fn();

    const mockStore = configureStore([]);
    const store = mockStore({
      ...state,
      comments: {
        comments: {
          [card2Comment.id]: card2Comment
        }
      },
      contents: {
        contents: {
          [card1Text.id]: card1Text
        }
      },
      cards: {
        cards: {
          [card1.id]: card1,
          [card2.id]: card2
        }
      }
    });

    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <Table
          board={board}
          activeView={view}
          visibleGroups={[]}
          cards={[card1, card2]}
          views={[view]}
          selectedCardIds={[]}
          readOnly={false}
          cardIdToFocusOnRender=''
          showCard={callback}
          addCard={addCard}
          onCardClicked={jest.fn()}
        />
      </ReduxProvider>
    );

    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
