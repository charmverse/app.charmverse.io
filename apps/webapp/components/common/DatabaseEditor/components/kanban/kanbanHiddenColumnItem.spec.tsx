import '@testing-library/jest-dom';
import type { PageMeta } from '@packages/core/pages';
import type { IPropertyOption } from '@packages/databases/board';
import Mutator from '@packages/databases/mutator';
import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { pageStubToCreate } from '@packages/testing/generatePageStub';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { createIntl } from 'react-intl';
import { v4 } from 'uuid';

import { wrapDNDIntl } from '../../testUtils';

import KanbanHiddenColumnItem from './kanbanHiddenColumnItem';

jest.mock('../../mutator');
const mockedMutator = jest.mocked(Mutator, { shallow: true });

describe.skip('src/components/kanban/kanbanHiddenColumnItem', () => {
  const intl = createIntl({ locale: 'en' });
  const board = TestBlockFactory.createBoard();
  const activeView = TestBlockFactory.createBoardView(board);
  const card = TestBlockFactory.createCard(board);
  const option: IPropertyOption = {
    id: 'id1',
    value: 'propOption',
    color: 'propColorDefault'
  };
  beforeAll(() => {});

  const group = {
    id: option.id,
    option,
    cards: [card]
  };

  test('should match snapshot', () => {
    const { container } = render(
      wrapDNDIntl(
        <KanbanHiddenColumnItem activeView={activeView} group={group} readOnly={false} onDrop={jest.fn()} intl={intl} />
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot readonly', () => {
    const { container } = render(
      wrapDNDIntl(
        <KanbanHiddenColumnItem activeView={activeView} group={group} readOnly={true} onDrop={jest.fn()} intl={intl} />
      )
    );
    expect(container).toMatchSnapshot();
  });

  test('return kanbanHiddenColumnItem, click menuwrapper and click show', () => {
    render(
      wrapDNDIntl(
        <KanbanHiddenColumnItem activeView={activeView} group={group} readOnly={false} onDrop={jest.fn()} intl={intl} />
      )
    );
    const buttonMenuWrapper = screen.getByRole('button', { name: 'menuwrapper' });
    userEvent.click(buttonMenuWrapper);
    const buttonShow = within(buttonMenuWrapper).getByRole('button', { name: 'Show' });
    userEvent.click(buttonShow);
    expect(mockedMutator.unhideViewColumn).toBeCalledWith(activeView, option.id);
  });
});
