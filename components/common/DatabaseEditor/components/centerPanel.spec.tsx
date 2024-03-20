import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';

import { Constants } from 'lib/databases/constants';

import { TestBlockFactory } from '../test/testBlockFactory';
import { mockDOM, mockStateStore, wrapDNDIntl, wrapPagesProvider } from '../testUtils';
import { Utils } from '../utils';

import CenterPanel from './centerPanel';

Object.defineProperty(Constants, 'versionString', { value: '1.0.0' });

jest.mock('../utils');
jest.mock('../mutator');

jest.mock('next/router', () => ({
  useRouter: () => ({
    asPath: '/test-space',
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

const mockedUtils = jest.mocked(Utils, { shallow: true });
mockedUtils.createGuid.mockReturnValue('test-id');
describe('components/centerPanel', () => {
  const board = TestBlockFactory.createBoard();
  board.id = '1';
  board.rootId = '1';
  const activeView = TestBlockFactory.createBoardView(board);
  activeView.id = '1';
  const card1 = TestBlockFactory.createCard(board);
  card1.id = '1';
  card1.title = 'card1';
  card1.fields.properties = { id: 'property_value_id_1' };
  const card2 = TestBlockFactory.createCard(board);
  card2.id = '2';
  card2.title = 'card2';
  card2.fields.properties = { id: 'property_value_id_1' };
  const state = {
    boards: {
      current: board.id,
      boards: {
        [board.id]: board
      }
    },
    users: {
      workspaceUsers: {}
    },
    cards: {
      templates: [card1, card2],
      cards: [card1, card2]
    },
    views: {
      views: {
        [activeView.id]: activeView
      },
      current: activeView.id
    }
  };
  const store = mockStateStore([], state);
  beforeAll(() => {
    mockDOM();
  });
  beforeEach(() => {
    activeView.fields.viewType = 'board';
    jest.clearAllMocks();
  });
  test('should match snapshot for Kanban', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <CenterPanel
            currentRootPageId={board.id}
            showView={jest.fn()}
            setPage={() => {}}
            views={[activeView]}
            board={board}
            activeView={activeView}
            readOnly={false}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot for Gallery', () => {
    activeView.fields.viewType = 'gallery';
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <CenterPanel
            currentRootPageId={board.id}
            showView={jest.fn()}
            setPage={() => {}}
            views={[activeView]}
            board={board}
            activeView={activeView}
            readOnly={false}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot for Table', () => {
    activeView.fields.viewType = 'table';
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <CenterPanel
            currentRootPageId={board.id}
            showView={jest.fn()}
            setPage={() => {}}
            views={[activeView]}
            board={board}
            activeView={activeView}
            readOnly={false}
            showCard={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });
  describe('return centerPanel and', () => {
    test('click on card to show card', () => {
      activeView.fields.viewType = 'board';
      const mockedShowCard = jest.fn();
      const { container } = render(
        wrapPagesProvider(
          [card1.id, card2.id],
          wrapDNDIntl(
            <ReduxProvider store={store}>
              <CenterPanel
                currentRootPageId={board.id}
                showView={jest.fn()}
                setPage={() => {}}
                views={[activeView]}
                board={board}
                activeView={activeView}
                readOnly={false}
                showCard={mockedShowCard}
              />
            </ReduxProvider>
          )
        )
      );

      const kanbanCardElements = container.querySelectorAll('.KanbanCard');
      const kanbanCardElement = kanbanCardElements[0];
      userEvent.click(kanbanCardElement);
      expect(container).toMatchSnapshot();
      expect(mockedShowCard).toBeCalledWith(card1.id, undefined);
    });
  });
});
