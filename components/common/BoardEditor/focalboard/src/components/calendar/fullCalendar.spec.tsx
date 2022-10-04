import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';

import type { IPropertyTemplate } from '../../blocks/board';
import { TestBlockFactory } from '../../test/testBlockFactory';
import { wrapIntl } from '../../testUtils';

import CalendarView from './fullCalendar';

jest.mock('../../mutator');

describe('components/calendar/toolbar', () => {
  const mockShow = jest.fn();
  const mockAdd = jest.fn();
  const dateDisplayProperty = {
    id: '12345',
    name: 'DateProperty',
    type: 'date',
    options: []
  } as IPropertyTemplate;
  const board = TestBlockFactory.createBoard();
  const view = TestBlockFactory.createBoardView(board);
  view.fields.viewType = 'calendar';
  view.fields.groupById = undefined;
  const card = TestBlockFactory.createCard(board);
  const fifth = Date.UTC(2021, 9, 5, 12);
  const twentieth = Date.UTC(2021, 9, 20, 12);
  card.createdAt = fifth;
  const rObject = { from: twentieth };

  test('return calendar, no date property', () => {
    const { container } = render(
      wrapIntl(
        <CalendarView
          board={board}
          activeView={view}
          cards={[card]}
          readOnly={false}
          showCard={mockShow}
          addCard={mockAdd}
          initialDate={new Date(fifth)}
        />
      )
    );
    expect(container).toMatchSnapshot();
  });
  test('return calendar, with date property not set', () => {
    board.fields.cardProperties.push(dateDisplayProperty);
    card.fields.properties['12345'] = JSON.stringify(rObject);
    const { container } = render(
      wrapIntl(
        <CalendarView
          board={board}
          activeView={view}
          cards={[card]}
          readOnly={false}
          showCard={mockShow}
          addCard={mockAdd}
          initialDate={new Date(fifth)}
        />
      )
    );
    expect(container).toMatchSnapshot();
  });

  test('return calendar, with date property set', () => {
    board.fields.cardProperties.push(dateDisplayProperty);
    card.fields.properties['12345'] = JSON.stringify(rObject);
    const { container } = render(
      wrapIntl(
        <CalendarView
          board={board}
          activeView={view}
          readOnly={false}
          dateDisplayProperty={dateDisplayProperty}
          cards={[card]}
          showCard={mockShow}
          addCard={mockAdd}
          initialDate={new Date(fifth)}
        />
      )
    );
    expect(container).toMatchSnapshot();
  });
});
