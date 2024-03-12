import { render } from '@testing-library/react';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import '@testing-library/jest-dom';

import { TestBlockFactory } from '../../test/testBlockFactory';
import { mockStateStore, wrapDNDIntl } from '../../testUtils';

import ViewHeader from './viewHeader';

const board = TestBlockFactory.createBoard();
const activeView = TestBlockFactory.createBoardView(board);
const card = TestBlockFactory.createCard(board);
card.id = 'card-id-1';
activeView.id = 'view-id-1';

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    asPath: '/test-space',
    isReady: true
  })
}));

describe('components/viewHeader/viewHeader', () => {
  const state = {
    boards: {
      current: board
    },
    cards: {
      templates: [card]
    },
    views: {
      views: {
        boardView: activeView
      },
      current: 'boardView'
    }
  };
  const store = mockStateStore([], state);
  test('return viewHeader', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <ViewHeader
            showCard={jest.fn()}
            showView={jest.fn()}
            toggleViewOptions={jest.fn()}
            viewsBoard={board}
            activeView={activeView}
            views={[activeView]}
            cards={[card]}
            addCard={jest.fn()}
            addCardTemplate={jest.fn()}
            readOnly={false}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('return viewHeader readonly', () => {
    const { container } = render(
      wrapDNDIntl(
        <ReduxProvider store={store}>
          <ViewHeader
            viewsBoard={board}
            showCard={jest.fn()}
            showView={jest.fn()}
            toggleViewOptions={jest.fn()}
            activeView={activeView}
            views={[activeView]}
            cards={[card]}
            addCard={jest.fn()}
            addCardTemplate={jest.fn()}
            readOnly={true}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });
});
