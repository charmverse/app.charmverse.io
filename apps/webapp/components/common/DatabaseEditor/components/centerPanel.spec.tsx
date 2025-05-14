import { Constants } from '@packages/databases/constants';
import type { RootState } from '@packages/databases/store/index';
import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { Utils } from '@packages/databases/utils';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';
import { vi } from 'vitest';

import { mockDOM, mockStateStore, wrapDNDIntl } from '../testUtils';

import CenterPanel from './centerPanel';

Object.defineProperty(Constants, 'versionString', { value: '1.0.0' });

vi.mock('@packages/databases/utils');
vi.mock('@packages/databases/mutator');

const mockedUtils = vi.mocked(Utils);
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
  const state: RootState = {
    boards: {
      current: board.id,
      boards: {
        [board.id]: board
      },
      templates: {}
    },
    cards: {
      templates: {
        [card1.id]: card1,
        [card2.id]: card2
      },
      cards: {
        [card1.id]: card1,
        [card2.id]: card2
      }
    },
    language: { value: 'en-us' },
    loadingState: {
      loaded: true
    },
    searchText: {
      value: ''
    },
    views: {
      views: {
        [activeView.id]: activeView
      },
      loadedBoardViews: {},
      current: activeView.id
    }
  };
  const store = mockStateStore([], state);
  beforeAll(() => {
    mockDOM();
  });
  beforeEach(() => {
    activeView.fields.viewType = 'board';
    vi.clearAllMocks();
  });
  test('should match snapshot for Kanban', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <CenterPanel
            currentRootPageId={board.id}
            showView={vi.fn()}
            setPage={() => {}}
            views={[activeView]}
            board={board}
            activeView={activeView}
            readOnly={false}
            showCard={vi.fn()}
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
            showView={vi.fn()}
            setPage={() => {}}
            views={[activeView]}
            board={board}
            activeView={activeView}
            readOnly={false}
            showCard={vi.fn()}
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
            showView={vi.fn()}
            setPage={() => {}}
            views={[activeView]}
            board={board}
            activeView={activeView}
            readOnly={false}
            showCard={vi.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });
  describe('return centerPanel and', () => {
    test('click on card to show card', () => {
      activeView.fields.viewType = 'board';
      const mockedShowCard = vi.fn();
      const { container } = render(
        wrapDNDIntl(
          <ReduxProvider store={store}>
            <CenterPanel
              currentRootPageId={board.id}
              showView={vi.fn()}
              setPage={() => {}}
              views={[activeView]}
              board={board}
              activeView={activeView}
              readOnly={false}
              showCard={mockedShowCard}
            />
          </ReduxProvider>
        )
      );

      const kanbanCardElements = container.querySelectorAll('.KanbanCard');
      const kanbanCardElement = kanbanCardElements[0];
      userEvent.click(kanbanCardElement);
      expect(container).toMatchSnapshot();
      expect(mockedShowCard).toBeCalledWith(card1.id, undefined, undefined);
    });
  });
});
