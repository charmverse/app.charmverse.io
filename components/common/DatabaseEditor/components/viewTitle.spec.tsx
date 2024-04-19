import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';

import mutator from '../mutator';
import { TestBlockFactory } from '../test/testBlockFactory';
import { mockDOM, mockStateStore, wrapIntl } from '../testUtils';
import { Utils } from '../utils';

import ViewTitle from './viewTitle';

jest.mock('../mutator');
jest.mock('../utils');

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {} })
}));

jest.mock('@ethereum-attestation-service/eas-sdk', () => ({}));

const mockedMutator = jest.mocked(mutator, { shallow: true });
const mockedUtils = jest.mocked(Utils, { shallow: true });
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
