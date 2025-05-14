import '@testing-library/jest-dom';
import type { BoardView } from '@packages/databases/boardView';
import { FetchMock } from '@packages/databases/test/fetchMock';
import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { render } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { wrapDNDIntl } from '../../testUtils';
import type { IUser } from '../../user';

import Table from './table';

window.fetch = FetchMock.fn;

beforeEach(() => {
  FetchMock.fn.mockReset();
});

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

describe.skip('components/table/Table', () => {
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
          cards={[]}
          board={board}
          activeView={view}
          visibleGroups={[]}
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
          cards={[]}
          board={board}
          activeView={view}
          visibleGroups={[]}
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
          cards={[]}
          board={board}
          activeView={{ ...view, fields: { ...view.fields, groupById: 'property1' } } as BoardView}
          visibleGroups={[{ id: '', option: { id: '', value: 'test', color: '' }, cards: [] }]}
          groupByProperty={{
            id: '',
            name: 'Property 1',
            type: 'text',
            options: [{ id: 'property1', value: 'Property 1', color: '' }]
          }}
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

    const dateCreatedId = 'property3';
    board.fields.cardProperties.push({
      id: dateCreatedId,
      name: 'Date Created',
      type: 'createdTime',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.createdAt = Date.parse('15 Jun 2021 16:22:00');
    card1.id = 'card-id-1';

    const card2 = TestBlockFactory.createCard(board);
    card2.createdAt = Date.parse('15 Jun 2021 16:22:00');
    card2.id = 'card-id-2';

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
          cards={[card1, card2]}
          board={board}
          activeView={view}
          visibleGroups={[]}
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

    const dateUpdatedId = 'property3';
    board.fields.cardProperties.push({
      id: dateUpdatedId,
      name: 'Date Updated',
      type: 'updatedTime',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.updatedAt = Date.parse('20 Jun 2021 12:22:00');
    card1.id = 'card-id-1';

    const card2 = TestBlockFactory.createCard(board);
    card2.updatedAt = Date.parse('20 Jun 2021 12:22:00');
    card2.id = 'card-id-2';

    const card2Text = TestBlockFactory.createCard(board);
    card2Text.parentId = card2.id;
    card2Text.type = 'card';
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
          cards={[card1, card2]}
          board={board}
          activeView={view}
          visibleGroups={[]}
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

    const createdById = 'property3';
    board.fields.cardProperties.push({
      id: createdById,
      name: 'Created By',
      type: 'createdBy',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.createdBy = 'user-id-1';
    card1.id = 'card-id-1';

    const card2 = TestBlockFactory.createCard(board);
    card2.createdBy = 'user-id-2';
    card2.id = 'card-id-2';

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
          cards={[card1, card2]}
          board={board}
          activeView={view}
          visibleGroups={[]}
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

    const updatedById = 'property3';
    board.fields.cardProperties.push({
      id: updatedById,
      name: 'Last Modified By',
      type: 'updatedBy',
      options: []
    });

    const card1 = TestBlockFactory.createCard(board);
    card1.updatedBy = 'user-id-1';
    card1.updatedAt = Date.parse('15 Jun 2021 16:22:00');
    card1.id = 'card-id-1';

    const card1Text = TestBlockFactory.createCard(board);
    card1Text.parentId = card1.id;
    card1Text.type = 'card';
    card1Text.updatedBy = 'user-id-4';
    card1Text.updatedAt = Date.parse('16 Jun 2021 16:22:00');

    card1.fields.contentOrder = [card1Text.id];

    const card2 = TestBlockFactory.createCard(board);
    card2.updatedBy = 'user-id-2';
    card2.updatedAt = Date.parse('15 Jun 2021 16:22:00');
    card2.id = 'card-id-2';

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
          cards={[card1, card2]}
          board={board}
          activeView={view}
          visibleGroups={[]}
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
