import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider as ReduxProvider } from 'react-redux';

import type { IPropertyTemplate } from 'lib/focalboard/board';

import Mutator from '../../mutator';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { mockStateStore, wrapDNDIntl, wrapPagesProvider } from '../../testUtils';

import KanbanCard from './kanbanCard';

jest.mock('../../mutator');
jest.mock('../../utils');
const mockedMutator = jest.mocked(Mutator, { shallow: true });

jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/[domain]/',
    query: {
      domain: 'test-space'
    },
    isReady: true
  })
}));

const cardId = '86382f29-b73b-42c2-b3bd-b69d2143e7f3';

describe('src/components/kanban/kanbanCard', () => {
  const board = TestBlockFactory.createBoard();
  const card = TestBlockFactory.createCard(board);
  card.id = cardId;
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
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <ReduxProvider store={store}>
            <KanbanCard
              card={card}
              board={board}
              visiblePropertyTemplates={[propertyTemplate]}
              isSelected={false}
              readOnly={false}
              onDrop={jest.fn()}
              showCard={jest.fn()}
              isManualSort={false}
            />
          </ReduxProvider>
        )
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot with readonly', () => {
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <ReduxProvider store={store}>
            <KanbanCard
              card={card}
              board={board}
              visiblePropertyTemplates={[propertyTemplate]}
              isSelected={false}
              readOnly={true}
              onDrop={jest.fn()}
              showCard={jest.fn()}
              isManualSort={false}
            />
          </ReduxProvider>
        )
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('return kanbanCard and click on delete menu ', async () => {
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <ReduxProvider store={store}>
            <KanbanCard
              card={card}
              board={board}
              visiblePropertyTemplates={[propertyTemplate]}
              isSelected={false}
              readOnly={false}
              onDrop={jest.fn()}
              showCard={jest.fn()}
              isManualSort={false}
            />
          </ReduxProvider>
        )
      )
    );

    const buttonElement = container.querySelector('[data-testid="page-actions-context-menu"] button') as Element;
    userEvent.click(buttonElement);
    expect(container).toMatchSnapshot();

    const deleteButton = screen.getByText('Delete') as Element;
    userEvent.click(deleteButton, undefined, { skipPointerEventsCheck: true });
    const deleteButtonModal = screen.getByRole('button', { name: 'Delete' }) as Element;
    userEvent.click(deleteButtonModal, undefined, { skipPointerEventsCheck: true });
    expect(mockedMutator.deleteBlock).toBeCalledTimes(1);
    expect(mockedMutator.deleteBlock).toBeCalledWith({ id: card.id, type: card.type }, 'delete card');
  });
});
