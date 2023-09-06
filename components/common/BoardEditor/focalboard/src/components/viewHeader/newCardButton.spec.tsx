import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import charmClient from 'charmClient';

import { TestBlockFactory } from '../../test/testBlockFactory';
import { mockStateStore, wrapIntl } from '../../testUtils';

import NewCardButton from './newCardButton';

const board = TestBlockFactory.createBoard();
const activeView = TestBlockFactory.createBoardView(board);

jest.mock('charmClient', () => ({
  permissions: {
    pages: {
      computePagePermissions: jest.fn()
    }
  }
}));

describe('components/viewHeader/newCardButton', () => {
  const state = {
    users: {
      me: {
        id: 'user-id-1',
        username: 'username_1'
      }
    },
    boards: {
      current: board
    },
    cards: {
      templates: []
    },
    views: {
      current: 0,
      views: [activeView]
    }
  };

  const store = mockStateStore([], state);
  const mockFunction = jest.fn();

  charmClient.permissions.pages.computePagePermissions = jest.fn().mockReturnValue({
    edit_content: true
  });

  test('return NewCardButton', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <NewCardButton
            boardId='board-id-1'
            deleteCardTemplate={jest.fn()}
            showCard={jest.fn()}
            addCard={jest.fn()}
            addCardTemplate={jest.fn()}
            addCardFromTemplate={jest.fn()}
            editCardTemplate={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });

  test('return NewCardButton and addCard', () => {
    render(
      wrapIntl(
        <ReduxProvider store={store}>
          <NewCardButton
            boardId='board-id-1'
            deleteCardTemplate={jest.fn()}
            showCard={jest.fn()}
            addCard={mockFunction}
            addCardTemplate={jest.fn()}
            addCardFromTemplate={jest.fn()}
            editCardTemplate={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    const buttonAdd = screen.getByRole('button', { name: 'New' });
    userEvent.click(buttonAdd);
    expect(mockFunction).toBeCalledTimes(1);
  });

  test('return NewCardButton and addCardTemplate', async () => {
    render(
      wrapIntl(
        <ReduxProvider store={store}>
          <NewCardButton
            boardId='board-id-2'
            deleteCardTemplate={jest.fn()}
            showCard={jest.fn()}
            addCard={jest.fn()}
            addCardTemplate={mockFunction}
            addCardFromTemplate={jest.fn()}
            editCardTemplate={jest.fn()}
          />
        </ReduxProvider>
      )
    );

    const buttonAdd = ((await screen.findByTestId('KeyboardArrowDownIcon')) as Element).parentElement as Element;
    userEvent.click(buttonAdd);
    const buttonAddTemplate = screen.getByText('New template');
    userEvent.click(buttonAddTemplate);
    expect(mockFunction).toBeCalledTimes(1);
  });
});
