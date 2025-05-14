import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';
import type { MockStoreEnhanced } from 'redux-mock-store';

import { mockStateStore, wrapDNDIntl } from '../../testUtils';

import GalleryCard from './galleryCard';

jest.mock('../../mutator');
jest.mock('../../utils');
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

describe('src/components/gallery/GalleryCard', () => {
  const board = TestBlockFactory.createBoard();
  board.id = 'boardId';

  const activeView = TestBlockFactory.createBoardView(board);
  activeView.fields.sortOptions = [];

  const card = TestBlockFactory.createCard(board);
  card.id = 'cardId';

  let store: MockStoreEnhanced<unknown, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('without block content', () => {
    beforeEach(() => {
      const state = {
        cards: {
          cards: {
            [card.id]: card
          }
        },
        comments: {
          comments: {}
        }
      };
      store = mockStateStore([], state);
    });
    test('should match snapshot', () => {
      const { container } = render(
        wrapDNDIntl(
          <ReduxProvider store={store}>
            <GalleryCard
              board={board}
              card={card}
              onClick={jest.fn()}
              visiblePropertyTemplates={[
                {
                  id: card.id,
                  name: 'testTemplateProperty',
                  type: 'text',
                  options: [{ id: '1', value: 'testValue', color: 'blue' }]
                }
              ]}
              visibleTitle={true}
              isSelected={true}
              readOnly={false}
              onDrop={jest.fn()}
            />
          </ReduxProvider>
        )
      );
      expect(container).toMatchSnapshot();
    });
    test('return GalleryCard and click on it', () => {
      const mockedOnClick = jest.fn();
      const { container } = render(
        wrapDNDIntl(
          <ReduxProvider store={store}>
            <GalleryCard
              board={board}
              card={card}
              onClick={mockedOnClick}
              visiblePropertyTemplates={[]}
              visibleTitle={true}
              isSelected={true}
              readOnly={false}
              onDrop={jest.fn()}
            />
          </ReduxProvider>
        )
      );
      const galleryCardElement = container.querySelector('.GalleryCard');
      userEvent.click(galleryCardElement!);

      expect(mockedOnClick).toBeCalledTimes(1);
    });
    test.skip('return GalleryCard and delete card', async () => {
      const { container } = render(
        wrapDNDIntl(
          <ReduxProvider store={store}>
            <GalleryCard
              board={board}
              card={card}
              onClick={jest.fn()}
              visiblePropertyTemplates={[]}
              visibleTitle={true}
              isSelected={true}
              readOnly={false}
              onDrop={jest.fn()}
            />
          </ReduxProvider>
        )
      );

      const buttonElement = container.querySelector('[data-testid="page-actions-context-menu"] button') as Element;
      userEvent.click(buttonElement);
      const deleteButton = screen.getByText('Delete') as Element;
      userEvent.click(deleteButton, undefined, { skipPointerEventsCheck: true });
    });
  });
});
