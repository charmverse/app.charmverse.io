import mutator from '@packages/databases/mutator';
import type { RootState } from '@packages/databases/store/index';
import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { fireEvent, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';

import { AppThemeProvider } from 'theme/AppThemeProvider';

import { mockStateStore, wrapDNDIntl } from '../../testUtils';

import Gallery from './gallery';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: ''
  })
}));

jest.mock('@packages/databases/mutator');

const mockedMutator = jest.mocked(mutator, { shallow: true });

describe('src/components/gallery/Gallery', () => {
  const board = TestBlockFactory.createBoard();
  const activeView = TestBlockFactory.createBoardView(board);
  activeView.fields.sortOptions = [];
  const card = TestBlockFactory.createCard(board);
  card.id = 'card1';
  const card2 = TestBlockFactory.createCard(board);
  card2.id = 'card2';
  const state: Partial<RootState> = {
    cards: {
      cards: {
        [card.id]: card,
        [card2.id]: card2
      },
      templates: {}
    }
  };
  const store = mockStateStore([], state);
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('should match snapshot', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Gallery
            board={board}
            cards={[card, card2]}
            activeView={activeView}
            readOnly={false}
            addCard={jest.fn()}
            selectedCardIds={[card.id]}
            onCardClicked={jest.fn()}
          />
        </ReduxProvider>
      )
    );

    expect(container).toMatchSnapshot();
  });
  test('return Gallery and click new', () => {
    const mockAddCard = jest.fn();
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Gallery
            board={board}
            cards={[card, card2]}
            activeView={activeView}
            readOnly={false}
            addCard={mockAddCard}
            selectedCardIds={[card.id]}
            onCardClicked={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();

    const elementNew = container.querySelector('.octo-gallery-new')!;
    expect(elementNew).toBeDefined();
    userEvent.click(elementNew);
    expect(mockAddCard).toBeCalledTimes(1);
  });

  test('return Gallery readonly', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <Gallery
            board={board}
            cards={[card, card2]}
            activeView={activeView}
            readOnly={true}
            addCard={jest.fn()}
            selectedCardIds={[card.id]}
            onCardClicked={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });
  test.skip('return Gallery and drag and drop card', async () => {
    const { container } = render(
      wrapDNDIntl(
        <AppThemeProvider>
          <ReduxProvider store={store}>
            <Gallery
              board={board}
              cards={[card, card2]}
              activeView={activeView}
              readOnly={false}
              addCard={jest.fn()}
              selectedCardIds={[]}
              onCardClicked={jest.fn()}
            />
          </ReduxProvider>
        </AppThemeProvider>
      )
    );
    const allGalleryCard = container.querySelectorAll('.GalleryCard');
    const drag = allGalleryCard[0];

    const drop = allGalleryCard[1];
    fireEvent.dragStart(drag);
    fireEvent.dragEnter(drop);
    fireEvent.dragOver(drop);
    fireEvent.drop(drop);
    expect(mockedMutator.performAsUndoGroup).toBeCalledTimes(1);
  });
});
