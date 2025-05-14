import mutator from '@packages/databases/mutator';
import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { Utils } from '@packages/databases/utils';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { vi } from 'vitest';

import { mockDOM, mockStateStore, wrapIntl } from '../testUtils';

import ViewTitle from './viewTitle';

vi.mock('@packages/databases/mutator');
vi.mock('@packages/databases/utils');

const mockedMutator = vi.mocked(mutator);
const mockedUtils = vi.mocked(Utils);
mockedUtils.createGuid.mockReturnValue('test-id');

beforeAll(() => {
  mockDOM();
});

describe('components/viewTitle', () => {
  const board = TestBlockFactory.createBoard();
  board.id = 'test-id';
  board.rootId = board.id;
  const state = {
    users: {
      workspaceUsers: {
        1: { username: 'abc' },
        2: { username: 'd' },
        3: { username: 'e' },
        4: { username: 'f' },
        5: { username: 'g' }
      }
    }
  };
  const store = mockStateStore([], state);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should match snapshot', async () => {
    let container;
    await act(async () => {
      const result = render(
        wrapIntl(
          <ReduxProvider store={store}>
            <ViewTitle pageTitle='Page title' board={board} readOnly={false} setPage={() => {}} />
          </ReduxProvider>
        )
      );
      container = result.container;
    });
    expect(container).toMatchSnapshot();
  });

  test('should match snapshot readonly', async () => {
    let container;
    await act(async () => {
      const result = render(
        wrapIntl(
          <ReduxProvider store={store}>
            <ViewTitle pageTitle='Page title' board={board} readOnly={true} setPage={() => {}} />
          </ReduxProvider>
        )
      );
      container = result.container;
    });
    expect(container).toMatchSnapshot();
  });

  test('show description', async () => {
    board.fields.showDescription = true;
    let container;
    await act(async () => {
      const result = render(
        wrapIntl(
          <ReduxProvider store={store}>
            <ViewTitle pageTitle='Page title' board={board} readOnly={false} setPage={() => {}} />
          </ReduxProvider>
        )
      );
      container = result.container;
    });
    expect(container).toMatchSnapshot();
    const hideDescriptionButton = screen.getAllByRole('button')[2];
    userEvent.click(hideDescriptionButton);
    expect(mockedMutator.showDescription).toBeCalledTimes(1);
  });

  test('hide description', async () => {
    board.fields.showDescription = false;
    let container;
    await act(async () => {
      const result = render(
        wrapIntl(
          <ReduxProvider store={store}>
            <ViewTitle pageTitle='Page title' board={board} readOnly={false} setPage={() => {}} />
          </ReduxProvider>
        )
      );
      container = result.container;
    });
    expect(container).toMatchSnapshot();
    const showDescriptionButton = screen.getAllByRole('button')[2];
    userEvent.click(showDescriptionButton);
    expect(mockedMutator.showDescription).toBeCalledTimes(1);
  });
});
