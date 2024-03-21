import '@testing-library/jest-dom';
import type { PageMeta } from '@charmverse/core/pages';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { createIntl } from 'react-intl';
import { v4 } from 'uuid';

import type { IPropertyOption } from 'lib/databases/board';
import { pageStubToCreate } from 'testing/generatePageStub';

import Mutator from '../../mutator';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapDNDIntl, wrapPagesProvider } from '../../testUtils';

import KanbanHiddenColumnItem from './kanbanHiddenColumnItem';

jest.mock('../../mutator');
const mockedMutator = jest.mocked(Mutator, { shallow: true });

describe('src/components/kanban/kanbanHiddenColumnItem', () => {
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
    option,
    cardPages: [
      {
        card,
        page: pageStubToCreate({ spaceId: v4(), createdBy: v4(), id: card.id, path: card.id }) as PageMeta
      }
    ],
    cards: [card]
  };

  test('should match snapshot', () => {
    const { container } = render(
      wrapPagesProvider(
        card.id,
        wrapDNDIntl(
          <KanbanHiddenColumnItem
            activeView={activeView}
            group={group}
            readOnly={false}
            onDrop={jest.fn()}
            intl={intl}
          />
        )
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot readonly', () => {
    const { container } = render(
      wrapPagesProvider(
        card.id,
        wrapDNDIntl(
          <KanbanHiddenColumnItem
            activeView={activeView}
            group={group}
            readOnly={true}
            onDrop={jest.fn()}
            intl={intl}
          />
        )
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
