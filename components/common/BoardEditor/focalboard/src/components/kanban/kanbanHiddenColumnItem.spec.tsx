import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { createIntl } from 'react-intl';

import type { IPropertyOption } from '../../blocks/board';
import Mutator from '../../mutator';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl } from '../../testUtils';

import KanbanHiddenColumnItem from './kanbanHiddenColumnItem';

jest.mock('../../mutator');
const mockedMutator = jest.mocked(Mutator, true);

describe('src/components/kanban/kanbanHiddenColumnItem', () => {
  const intl = createIntl({ locale: 'en-us' });
  const board = TestBlockFactory.createBoard();
  const activeView = TestBlockFactory.createBoardView(board);
  const card = TestBlockFactory.createCard(board);
  const option:IPropertyOption = {
    id: 'id1',
    value: 'propOption',
    color: 'propColorDefault'
  };
  beforeAll(() => {

  });
  test('should match snapshot', () => {
    const { container } = render(wrapDNDIntl(
      <KanbanHiddenColumnItem
        activeView={activeView}
        group={{
          option,
          cards: [card]
        }}
        readOnly={false}
        onDrop={jest.fn()}
        intl={intl}
      />
    ));
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot readonly', () => {
    const { container } = render(wrapDNDIntl(
      <KanbanHiddenColumnItem
        activeView={activeView}
        group={{
          option,
          cards: [card]
        }}
        readOnly={true}
        onDrop={jest.fn()}
        intl={intl}
      />
    ));
    expect(container).toMatchSnapshot();
  });
  test('return kanbanHiddenColumnItem and click menuwrapper', () => {
    const { container } = render(wrapDNDIntl(
      <KanbanHiddenColumnItem
        activeView={activeView}
        group={{
          option,
          cards: [card]
        }}
        readOnly={false}
        onDrop={jest.fn()}
        intl={intl}
      />
    ));
    const buttonMenuWrapper = screen.getByRole('button', { name: 'menuwrapper' });
    expect(buttonMenuWrapper).not.toBeNull();
    userEvent.click(buttonMenuWrapper);
    expect(container).toMatchSnapshot();
  });
  test('return kanbanHiddenColumnItem, click menuwrapper and click show', () => {
    const { container } = render(wrapDNDIntl(
      <KanbanHiddenColumnItem
        activeView={activeView}
        group={{
          option,
          cards: [card]
        }}
        readOnly={false}
        onDrop={jest.fn()}
        intl={intl}
      />
    ));
    const buttonMenuWrapper = screen.getByRole('button', { name: 'menuwrapper' });
    expect(buttonMenuWrapper).not.toBeNull();
    userEvent.click(buttonMenuWrapper);
    expect(container).toMatchSnapshot();
    const buttonShow = within(buttonMenuWrapper).getByRole('button', { name: 'Show' });
    userEvent.click(buttonShow);
    expect(mockedMutator.unhideViewColumn).toBeCalledWith(activeView, option.id);
  });
});
