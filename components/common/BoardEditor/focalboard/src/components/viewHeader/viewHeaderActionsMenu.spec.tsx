
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import { Archiver } from '../../archiver';
import { CsvExporter } from '../../csvExporter';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { mockStateStore, wrapIntl } from '../../testUtils';

import ViewHeaderActionsMenu from './viewHeaderActionsMenu';

jest.mock('../../archiver');
jest.mock('../../csvExporter');
jest.mock('../../mutator');
const mockedArchiver = jest.mocked(Archiver, true);
const mockedCsvExporter = jest.mocked(CsvExporter, true);

const board = TestBlockFactory.createBoard();
const activeView = TestBlockFactory.createBoardView(board);
const card = TestBlockFactory.createCard(board);

describe('components/viewHeader/viewHeaderActionsMenu', () => {
  const state = {
    users: {
      me: {
        id: 'user-id-1',
        username: 'username_1'
      }
    }
  };
  const store = mockStateStore([], state);
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('return menu with Share Boards', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <ViewHeaderActionsMenu
            board={board}
            activeView={activeView}
            cards={[card]}
          />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', {
      name: 'View menu'
    });
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();
  });

  test('return menu without Share Boards', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <ViewHeaderActionsMenu
            board={board}
            activeView={activeView}
            cards={[card]}
          />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', {
      name: 'View menu'
    });
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();
  });
  test('return menu and verify call to csv exporter', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <ViewHeaderActionsMenu
            board={board}
            activeView={activeView}
            cards={[card]}
          />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', { name: 'View menu' });
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();
    const buttonExportCSV = screen.getByRole('button', { name: 'Export to CSV' });
    userEvent.click(buttonExportCSV);
    expect(mockedCsvExporter.exportTableCsv).toBeCalledTimes(1);
  });

  test('return menu and verify call to board archive', () => {
    const { container } = render(
      wrapIntl(
        <ReduxProvider store={store}>
          <ViewHeaderActionsMenu
            board={board}
            activeView={activeView}
            cards={[card]}
          />
        </ReduxProvider>
      )
    );
    const buttonElement = screen.getByRole('button', { name: 'View menu' });
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();
    const buttonExportBoardArchive = screen.getByRole('button', { name: 'Export board archive' });
    userEvent.click(buttonExportBoardArchive);
    expect(mockedArchiver.exportBoardArchive).toBeCalledTimes(1);
    expect(mockedArchiver.exportBoardArchive).toBeCalledWith(board);
  });
});
