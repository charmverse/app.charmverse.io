import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const store = mockStateStore([], state);
  const mockFunction = jest.fn();

  test('return NewCardButton', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <NewCardButton
            templatesBoard={{ id: 'board-id-1', title: '' }}
            deleteCardTemplate={jest.fn()}
            showCard={jest.fn()}
            addCard={jest.fn()}
            addCardTemplate={jest.fn()}
            addCardFromTemplate={jest.fn()}
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
            templatesBoard={{ id: 'board-id-1', title: '' }}
            deleteCardTemplate={jest.fn()}
            showCard={jest.fn()}
            addCard={mockFunction}
            addCardTemplate={jest.fn()}
            addCardFromTemplate={jest.fn()}
          />
        </ReduxProvider>
      )
    );
    const buttonAdd = screen.getByRole('button', { name: 'New' });
    userEvent.click(buttonAdd);
    expect(mockFunction).toBeCalledTimes(1);
  });

  test('return NewCardButton and addCardTemplate', async () => {
    charmClient.permissions.pages.computePagePermissions = jest.fn().mockResolvedValueOnce({
      edit_content: true
    });

    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <NewCardButton
            templatesBoard={{ id: 'board-id-2', title: '' }}
            deleteCardTemplate={jest.fn()}
            showCard={jest.fn()}
            addCard={jest.fn()}
            addCardTemplate={mockFunction}
            addCardFromTemplate={jest.fn()}
          />
        </ReduxProvider>
      )
    );

    const buttonAdd = (container.querySelector('[data-testid="KeyboardArrowDownIcon"]') as Element)
      .parentElement as Element;
    userEvent.click(buttonAdd);
    const buttonAddTemplate = await waitFor(() => screen.getByText('New template'));
    userEvent.click(buttonAddTemplate);
    expect(mockFunction).toBeCalledTimes(1);
  });
});
