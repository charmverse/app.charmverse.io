import '@testing-library/jest-dom';

import { render } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import configureStore from 'redux-mock-store';

import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl } from '../../testUtils';

import TableRow from './tableRow';

const date = 'Wed Sep 06 2023 22:03:26';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

describe('components/table/TableRow', () => {
  const board = TestBlockFactory.createBoard();
  const view = TestBlockFactory.createBoardView(board);

  const view2 = TestBlockFactory.createBoardView(board);
  view2.fields.sortOptions = [];

  const card = TestBlockFactory.createCard(board);
  const cardTemplate = TestBlockFactory.createCard(board);
  cardTemplate.fields.isTemplate = true;
  card.id = 'card-1';

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
      }
    }
  };

  const mockStore = configureStore([]);

  test('should match snapshot', async () => {
    const store = mockStore(state);
    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <TableRow
          board={board}
          activeView={view}
          card={card}
          isSelected={false}
          focusOnMount={false}
          pageUpdatedBy='user-1'
          pageTitle='Page Title'
          pageUpdatedAt={date}
          saveTitle={jest.fn()}
          showCard={jest.fn()}
          readOnly={false}
          offset={0}
          resizingColumn=''
          columnRefs={new Map()}
          onDrop={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot, read-only', async () => {
    const store = mockStore(state);
    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <TableRow
          board={board}
          card={card}
          activeView={view}
          isSelected={false}
          focusOnMount={false}
          pageUpdatedBy='user-1'
          pageTitle='Page Title'
          pageUpdatedAt={date}
          saveTitle={jest.fn()}
          showCard={jest.fn()}
          readOnly={true}
          offset={0}
          resizingColumn=''
          columnRefs={new Map()}
          onDrop={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot, isSelected', async () => {
    const store = mockStore(state);
    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <TableRow
          board={board}
          card={card}
          activeView={view}
          isSelected={true}
          focusOnMount={false}
          pageUpdatedBy='user-1'
          pageTitle='Page Title'
          pageUpdatedAt={date}
          saveTitle={jest.fn()}
          showCard={jest.fn()}
          readOnly={false}
          offset={0}
          resizingColumn=''
          columnRefs={new Map()}
          onDrop={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot, display properties', async () => {
    view.fields.visiblePropertyIds = ['property1', 'property2'];

    const store = mockStore(state);
    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <TableRow
          board={board}
          card={card}
          activeView={view}
          isSelected={false}
          focusOnMount={false}
          pageUpdatedBy='user-1'
          pageTitle='Page Title'
          pageUpdatedAt={date}
          saveTitle={jest.fn()}
          showCard={jest.fn()}
          readOnly={false}
          offset={0}
          resizingColumn=''
          columnRefs={new Map()}
          onDrop={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot, resizing column', async () => {
    view.fields.visiblePropertyIds = ['property1', 'property2'];

    const store = mockStore(state);
    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <TableRow
          board={board}
          card={card}
          activeView={view}
          isSelected={false}
          focusOnMount={false}
          pageUpdatedBy='user-1'
          pageTitle='Page Title'
          pageUpdatedAt={date}
          saveTitle={jest.fn()}
          showCard={jest.fn()}
          readOnly={false}
          offset={0}
          resizingColumn='property1'
          columnRefs={new Map()}
          onDrop={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });

  test('should match snapshots with a nested row', async () => {
    view.fields.visiblePropertyIds = ['property1', 'property2'];
    const cardWithRows = {
      ...card,
      subPages: [{ ...card, id: 'sub-page' }]
    };

    const store = mockStore(state);
    const component = wrapDNDIntl(
      <ReduxProvider store={store}>
        <TableRow
          board={board}
          card={cardWithRows}
          subPages={[{ ...card, id: 'sub-page' }]}
          activeView={view}
          isExpanded={true}
          isNested={true}
          isSelected={false}
          focusOnMount={false}
          pageUpdatedBy='user-1'
          pageTitle='Page Title'
          pageUpdatedAt={date}
          saveTitle={jest.fn()}
          showCard={jest.fn()}
          readOnly={false}
          offset={0}
          resizingColumn='property1'
          columnRefs={new Map()}
          onDrop={jest.fn()}
        />
      </ReduxProvider>
    );
    const { container } = render(component);
    expect(container).toMatchSnapshot();
  });
});
