import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import mutator from '../../mutator';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapIntl, mockStateStore } from '../../testUtils';

import Comment from './comment';

jest.mock('../../mutator');
const mockedMutator = jest.mocked(mutator, { shallow: true });

const board = TestBlockFactory.createBoard();
const card = TestBlockFactory.createCard(board);
const comment = TestBlockFactory.createComment(card);
const dateFixed = Date.parse('01 Oct 2020');
comment.createdAt = dateFixed;
comment.updatedAt = dateFixed;
comment.title = 'Test comment';
const member = { username: 'Test user', hasNftAvatar: false, avatar: undefined };

describe('components/cardDetail/comment', () => {
  const state = {
    users: {
      workspaceUsers: [{ username: 'username_1' }]
    }
  };
  const store = mockStateStore([], state);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('return comment', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <Comment comment={comment} member={member} readOnly={false} />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', { name: 'menuwrapper' });
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();
  });

  test('return comment readonly', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <Comment comment={comment} member={member} readOnly={true} />
        </ReduxProvider>
      )
    );
    expect(container).toMatchSnapshot();
  });

  test('return comment and delete comment', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <Comment comment={comment} member={member} readOnly={false} />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', { name: 'menuwrapper' });
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();
    const buttonDelete = screen.getByRole('button', { name: 'Delete' });
    userEvent.click(buttonDelete);
    expect(mockedMutator.deleteBlock).toBeCalledTimes(1);
    expect(mockedMutator.deleteBlock).toBeCalledWith(comment);
  });
});
