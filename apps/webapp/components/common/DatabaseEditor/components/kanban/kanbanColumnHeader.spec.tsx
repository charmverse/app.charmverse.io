import type { PageMeta } from '@charmverse/core/pages';
import type { IPropertyOption } from '@packages/databases/board';
import Mutator from '@packages/databases/mutator';
import { TestBlockFactory } from '@packages/databases/test/testBlockFactory';
import { pageStubToCreate } from '@packages/testing/generatePageStub';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createIntl } from 'react-intl';
import { v4 } from 'uuid';

import { wrapDNDIntl, wrapPagesProvider } from '../../testUtils';

import KanbanColumnHeader from './kanbanColumnHeader';

jest.mock('../../mutator');
const mockedMutator = jest.mocked(Mutator, { shallow: true });
describe.skip('src/components/kanban/kanbanColumnHeader', () => {
  const intl = createIntl({ locale: 'en' });
  const board = TestBlockFactory.createBoard();
  const activeView = TestBlockFactory.createBoardView(board);
  const card = TestBlockFactory.createCard(board);
  card.id = 'id1';
  activeView.fields.kanbanCalculations = {
    id1: {
      calculation: 'countEmpty',
      propertyId: '1'
    }
  };
  const option: IPropertyOption = {
    id: 'id1',
    value: 'Title',
    color: 'propColorDefault'
  };

  const group = {
    id: option.id,
    option,
    cards: [card]
  };
  beforeAll(() => {});
  beforeEach(jest.resetAllMocks);
  test('should match snapshot', () => {
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <KanbanColumnHeader
            board={board}
            anchorEl={null}
            activeView={activeView}
            group={group}
            intl={intl}
            readOnly={false}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDropToColumn={jest.fn()}
            calculationMenuOpen={false}
            onCalculationMenuOpen={jest.fn()}
            onCalculationMenuClose={jest.fn()}
          />
        )
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('should match snapshot readonly', () => {
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <KanbanColumnHeader
            anchorEl={null}
            board={board}
            activeView={activeView}
            group={group}
            intl={intl}
            readOnly={true}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDropToColumn={jest.fn()}
            calculationMenuOpen={false}
            onCalculationMenuOpen={jest.fn()}
            onCalculationMenuClose={jest.fn()}
          />
        )
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('return kanbanColumnHeader and edit title', () => {
    const mockedPropertyNameChanged = jest.fn();
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <KanbanColumnHeader
            anchorEl={null}
            board={board}
            activeView={activeView}
            group={group}
            intl={intl}
            readOnly={false}
            addCard={jest.fn()}
            propertyNameChanged={mockedPropertyNameChanged}
            onDropToColumn={jest.fn()}
            calculationMenuOpen={false}
            onCalculationMenuOpen={jest.fn()}
            onCalculationMenuClose={jest.fn()}
          />
        )
      )
    );
    const inputTitle = screen.getByRole('textbox', { name: option.value });
    expect(inputTitle).toBeDefined();
    fireEvent.change(inputTitle, { target: { value: '' } });
    userEvent.type(inputTitle, 'New Title');
    fireEvent.blur(inputTitle);
    expect(mockedPropertyNameChanged).toBeCalledWith(option, 'New Title');
    expect(container).toMatchSnapshot();
  });

  test('return kanbanColumnHeader, click on menuwrapper and click on hide menu', async () => {
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <KanbanColumnHeader
            anchorEl={null}
            board={board}
            activeView={activeView}
            group={group}
            intl={intl}
            readOnly={false}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDropToColumn={jest.fn()}
            calculationMenuOpen={false}
            onCalculationMenuOpen={jest.fn()}
            onCalculationMenuClose={jest.fn()}
          />
        )
      )
    );
    const buttonMenuWrapper = container.querySelector('[data-testid="menu-wrapper"]') as Element;
    userEvent.click(buttonMenuWrapper);
    const buttonHide = screen.queryByText('Hide') as HTMLElement;
    userEvent.click(buttonHide);
    expect(mockedMutator.hideViewColumn).toBeCalledTimes(1);
  });
  test('return kanbanColumnHeader, click on menuwrapper and click on delete menu', async () => {
    const { container } = render(
      wrapDNDIntl(
        wrapPagesProvider(
          card.id,
          <KanbanColumnHeader
            anchorEl={null}
            board={board}
            activeView={activeView}
            group={group}
            intl={intl}
            readOnly={false}
            addCard={jest.fn()}
            propertyNameChanged={jest.fn()}
            onDropToColumn={jest.fn()}
            calculationMenuOpen={false}
            onCalculationMenuOpen={jest.fn()}
            onCalculationMenuClose={jest.fn()}
          />
        )
      )
    );

    const buttonMenuWrapper = container.querySelector('[data-testid="menu-wrapper"]') as Element;
    userEvent.click(buttonMenuWrapper);
    const buttonDelete = screen.queryByText('Delete') as HTMLElement;
    userEvent.click(buttonDelete);
    expect(mockedMutator.deletePropertyOption).toBeCalledTimes(1);
  });

  test('return kanbanColumnHeader, click on menuwrapper and click on blue color menu', async () => {
    const { container } = render(
      wrapDNDIntl(
        <KanbanColumnHeader
          anchorEl={null}
          board={board}
          activeView={activeView}
          group={group}
          intl={intl}
          readOnly={false}
          addCard={jest.fn()}
          propertyNameChanged={jest.fn()}
          onDropToColumn={jest.fn()}
          calculationMenuOpen={false}
          onCalculationMenuOpen={jest.fn()}
          onCalculationMenuClose={jest.fn()}
        />
      )
    );
    const buttonMenuWrapper = container.querySelector('[data-testid="menu-wrapper"]') as Element;
    userEvent.click(buttonMenuWrapper);
    const buttonBlueColor = screen.queryByText('Blue') as HTMLElement;
    userEvent.click(buttonBlueColor);
    expect(mockedMutator.changePropertyOptionColor).toBeCalledTimes(1);
  });

  test('return kanbanColumnHeader and click to add card', async () => {
    const mockedAddCard = jest.fn();
    const { container } = render(
      wrapDNDIntl(
        <KanbanColumnHeader
          anchorEl={null}
          board={board}
          activeView={activeView}
          group={group}
          intl={intl}
          readOnly={false}
          addCard={mockedAddCard}
          propertyNameChanged={jest.fn()}
          onDropToColumn={jest.fn()}
          calculationMenuOpen={false}
          onCalculationMenuOpen={jest.fn()}
          onCalculationMenuClose={jest.fn()}
        />
      )
    );
    const buttonAddCard = (container.querySelector('[data-testid="AddIcon"]') as Element).parentElement;
    userEvent.click(buttonAddCard!);
    expect(mockedAddCard).toBeCalledTimes(1);
  });

  test('return kanbanColumnHeader and click count on KanbanCalculationMenu', () => {
    render(
      wrapDNDIntl(
        <KanbanColumnHeader
          anchorEl={null}
          board={board}
          activeView={activeView}
          group={group}
          intl={intl}
          readOnly={false}
          addCard={jest.fn()}
          propertyNameChanged={jest.fn()}
          onDropToColumn={jest.fn()}
          calculationMenuOpen={true}
          onCalculationMenuOpen={jest.fn()}
          onCalculationMenuClose={jest.fn()}
        />
      )
    );
    const buttonKanbanCalculation = screen.getByText(/0/i).parentElement as Element;
    userEvent.click(buttonKanbanCalculation);
    const menuCountEmpty = screen.getByText('Count');
    expect(menuCountEmpty).toBeDefined();
    userEvent.click(menuCountEmpty);
    expect(mockedMutator.changeViewKanbanCalculations).toBeCalledTimes(1);
  });
});
