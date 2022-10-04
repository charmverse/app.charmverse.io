import '@testing-library/jest-dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import type { IPropertyTemplate } from '../../blocks/board';
import Mutator from '../../mutator';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { mockStateStore, wrapDNDIntl } from '../../testUtils';
import { Utils } from '../../utils';

import KanbanCard from './kanbanCard';

jest.mock('../../mutator');
jest.mock('../../utils');
// jest.mock('../../telemetry/telemetryClient')
const mockedUtils = jest.mocked(Utils, true);
const mockedMutator = jest.mocked(Mutator, true);

describe('src/components/kanban/kanbanCard', () => {
  const board = TestBlockFactory.createBoard();
  const card = TestBlockFactory.createCard(board);
  const propertyTemplate: IPropertyTemplate = {
    id: 'id',
    name: 'name',
    type: 'text',
    options: [
      {
        color: 'propColorOrange',
        id: 'property_value_id_1',
        value: 'Q1'
      },
      {
        color: 'propColorBlue',
        id: 'property_value_id_2',
        value: 'Q2'
      }
    ]
  };
  const state = {
    cards: {
      cards: [card]
    },
    contents: {},
    comments: {
      comments: {}
    }
  };
  const store = mockStateStore([], state);
  beforeEach(jest.clearAllMocks);
  test('should match snapshot', () => {
    const { container } = render(wrapDNDIntl(
      <ReduxProvider store={store}>
        <KanbanCard
          card={card}
          board={board}
          visiblePropertyTemplates={[propertyTemplate]}
          visibleBadges={false}
          isSelected={false}
          readOnly={false}
          onDrop={jest.fn()}
          showCard={jest.fn()}
          isManualSort={false}
        />
      </ReduxProvider>
    ));
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot with readonly', () => {
    const { container } = render(wrapDNDIntl(
      <ReduxProvider store={store}>
        <KanbanCard
          card={card}
          board={board}
          visiblePropertyTemplates={[propertyTemplate]}
          visibleBadges={false}
          isSelected={false}
          readOnly={true}
          onDrop={jest.fn()}
          showCard={jest.fn()}
          isManualSort={false}
        />
      </ReduxProvider>
    ));
    expect(container).toMatchSnapshot();
  });
  test('return kanbanCard and click on delete menu ', () => {
    const result = render(wrapDNDIntl(
      <ReduxProvider store={store}>
        <KanbanCard
          card={card}
          board={board}
          visiblePropertyTemplates={[propertyTemplate]}
          visibleBadges={false}
          isSelected={false}
          readOnly={false}
          onDrop={jest.fn()}
          showCard={jest.fn()}
          isManualSort={false}
        />
      </ReduxProvider>
    ));

    const { container } = result;

    const elementMenuWrapper = screen.getByRole('button', { name: 'menuwrapper' });
    expect(elementMenuWrapper).not.toBeNull();
    userEvent.click(elementMenuWrapper);
    expect(container).toMatchSnapshot();
    const elementButtonDelete = within(elementMenuWrapper).getByRole('button', { name: 'Delete' });
    expect(elementButtonDelete).not.toBeNull();
    userEvent.click(elementButtonDelete);

    const confirmDialog = screen.getByTitle('Confirmation Dialog Box');
    expect(confirmDialog).toBeDefined();
    const confirmButton = within(confirmDialog).getByRole('button', { name: 'Delete' });
    expect(confirmButton).toBeDefined();
    userEvent.click(confirmButton);

    expect(mockedMutator.deleteBlock).toBeCalledWith(card, 'delete card');
  });

  test('return kanbanCard and click on duplicate menu ', () => {
    const { container } = render(wrapDNDIntl(
      <ReduxProvider store={store}>
        <KanbanCard
          card={card}
          board={board}
          visiblePropertyTemplates={[propertyTemplate]}
          visibleBadges={false}
          isSelected={false}
          readOnly={false}
          onDrop={jest.fn()}
          showCard={jest.fn()}
          isManualSort={false}
        />
      </ReduxProvider>
    ));
    const elementMenuWrapper = screen.getByRole('button', { name: 'menuwrapper' });
    expect(elementMenuWrapper).not.toBeNull();
    userEvent.click(elementMenuWrapper);
    expect(container).toMatchSnapshot();
    const elementButtonDuplicate = within(elementMenuWrapper).getByRole('button', { name: 'Duplicate' });
    expect(elementButtonDuplicate).not.toBeNull();
    userEvent.click(elementButtonDuplicate);
    expect(mockedMutator.duplicateCard).toBeCalledTimes(1);
  });

  test('return kanbanCard and click on copy link menu ', () => {
    const { container } = render(wrapDNDIntl(
      <ReduxProvider store={store}>
        <KanbanCard
          card={card}
          board={board}
          visiblePropertyTemplates={[propertyTemplate]}
          visibleBadges={false}
          isSelected={false}
          readOnly={false}
          onDrop={jest.fn()}
          showCard={jest.fn()}
          isManualSort={false}
        />
      </ReduxProvider>
    ));
    const elementMenuWrapper = screen.getByRole('button', { name: 'menuwrapper' });
    expect(elementMenuWrapper).not.toBeNull();
    userEvent.click(elementMenuWrapper);
    expect(container).toMatchSnapshot();
    const elementButtonCopyLink = within(elementMenuWrapper).getByRole('button', { name: 'Copy link' });
    expect(elementButtonCopyLink).not.toBeNull();
    userEvent.click(elementButtonCopyLink);
    expect(mockedUtils.copyTextToClipboard).toBeCalledTimes(1);
  });
});
