// the fullcalendar lib most be loaded before any plugins
// eslint-disable-next-line import/order
import type { EventClickArg, EventChangeArg, EventInput, EventContentArg, DayCellContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import AddIcon from '@mui/icons-material/Add';
import type { Board, IPropertyTemplate } from '@packages/databases/board';
import type { BoardView } from '@packages/databases/boardView';
import type { Card } from '@packages/databases/card';
import { Constants } from '@packages/databases/constants';
import mutator from '@packages/databases/mutator';
import { isTruthy } from '@packages/utils/types';
import { useCallback, useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useUserPreferences } from 'hooks/useUserPreferences';

import type { DateProperty } from '../properties/dateRange/dateRange';
import { createDatePropertyFromString } from '../properties/dateRange/dateRange';
import PropertyValueElement from '../propertyValueElement';

const oneDay = 60 * 60 * 24 * 1000;

type Props = {
  board: Board;
  cards: Card[];
  activeView: BoardView;
  readOnly: boolean;
  initialDate?: Date;
  dateDisplayProperty?: IPropertyTemplate;
  showCard: (cardId: string) => void;
  addCard: (properties: Record<string, string>) => void;
  disableAddingCards?: boolean;
};

const timeZoneOffset = (date: number): number => {
  return new Date(date).getTimezoneOffset() * 60 * 1000;
};

function createDatePropertyFromCalendarDates(start: Date, end: Date): DateProperty {
  // save as noon local, expected from the date picker
  start.setHours(12);
  const dateFrom = start.getTime() - timeZoneOffset(start.getTime());
  end.setHours(12);
  const dateTo = end.getTime() - timeZoneOffset(end.getTime()) - oneDay; // subtract one day. Calendar is date exclusive

  const dateProperty: DateProperty = { from: dateFrom };
  if (dateTo !== dateFrom) {
    dateProperty.to = dateTo;
  }
  return dateProperty;
}

function createDatePropertyFromCalendarDate(start: Date): DateProperty {
  // save as noon local, expected from the date picker
  start.setHours(12);
  const dateFrom = start.getTime() - timeZoneOffset(start.getTime());

  const dateProperty: DateProperty = { from: dateFrom };
  return dateProperty;
}

function CalendarFullView(props: Props): JSX.Element | null {
  const intl = useIntl();
  const { addCard, board, cards, activeView, dateDisplayProperty, readOnly, showCard } = props;
  const isSelectable = !readOnly;
  const { userPreferences } = useUserPreferences();

  const visiblePropertyTemplates = useMemo(
    () =>
      activeView.fields.visiblePropertyIds
        .map((id) => board.fields.cardProperties.find((t) => t.id === id))
        .filter((i) => isTruthy(i) && i.id !== Constants.titleColumnId) as IPropertyTemplate[],
    [board.fields.cardProperties, activeView.fields.visiblePropertyIds]
  );

  let { initialDate } = props;
  if (!initialDate) {
    initialDate = new Date();
  }

  let isEditable = true;
  if (
    readOnly ||
    !dateDisplayProperty ||
    dateDisplayProperty.type === 'createdTime' ||
    dateDisplayProperty.type === 'updatedTime'
  ) {
    isEditable = false;
  }

  const myEventsList = useMemo(
    () =>
      cards.flatMap((card): EventInput[] => {
        let dateFrom = new Date(card.createdAt || 0);
        let dateTo = new Date(card.createdAt || 0);
        if (dateDisplayProperty && dateDisplayProperty?.type === 'updatedTime') {
          dateFrom = new Date(card.updatedAt || 0);
          dateTo = new Date(card.updatedAt || 0);
        } else if (dateDisplayProperty && dateDisplayProperty?.type !== 'createdTime') {
          const dateProperty = createDatePropertyFromString(
            card.fields.properties[dateDisplayProperty.id || ''] as string
          );
          if (!dateProperty.from) {
            return [];
          }

          // date properties are stored as 12 pm UTC, convert to 12 am (00) UTC for calendar
          dateFrom = dateProperty.from
            ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.from)))
            : new Date();
          dateFrom.setHours(0, 0, 0, 0);
          const dateToNumber = dateProperty.to
            ? dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.to))
            : dateFrom.getTime();
          dateTo = new Date(dateToNumber + oneDay); // Add one day.
          dateTo.setHours(0, 0, 0, 0);
        }
        return [
          {
            id: card.id,
            title: card.title || 'Untitled',
            extendedProps: { icon: card.icon },
            properties: card.fields.properties,
            updatedAt: card.updatedAt,
            allDay: true,
            start: dateFrom,
            end: dateTo
          }
        ];
      }),
    [cards, dateDisplayProperty]
  );

  const renderEventContent = useCallback(
    (eventProps: EventContentArg): JSX.Element | null => {
      const { event } = eventProps;
      const card = cards.find((c) => c.id === event.id);

      return (
        <div>
          <div className='octo-icontitle'>
            <div className='fc-event-title' key='__title'>
              {event.title || intl.formatMessage({ id: 'KanbanCard.untitled', defaultMessage: 'Untitled' })}
            </div>
          </div>
          {card &&
            visiblePropertyTemplates.map((template) => {
              return (
                <PropertyValueElement
                  board={board}
                  key={template.id}
                  readOnly
                  card={card}
                  updatedAt={card.updatedAt.toString() ?? ''}
                  updatedBy={card.updatedBy ?? ''}
                  propertyTemplate={template}
                  showEmptyPlaceholder
                  showTooltip
                  displayType='calendar'
                />
              );
            })}
        </div>
      );
    },
    [board, cards, visiblePropertyTemplates, intl]
  );

  const eventClick = useCallback(
    (eventProps: EventClickArg) => {
      const { event } = eventProps;
      showCard(event.id);
    },
    [showCard]
  );

  const eventChange = useCallback(
    (eventProps: EventChangeArg) => {
      const { event } = eventProps;
      if (!event.start) {
        return;
      }
      if (!event.end) {
        return;
      }

      const startDate = new Date(event.start.getTime());
      const endDate = new Date(event.end.getTime());
      const dateProperty = createDatePropertyFromCalendarDates(startDate, endDate);
      const card = cards.find((o) => o.id === event.id);
      if (card && dateDisplayProperty) {
        mutator.changePropertyValue(card, dateDisplayProperty.id, JSON.stringify(dateProperty));
      }
    },
    [cards, dateDisplayProperty]
  );

  const onNewEvent = useCallback(
    (args: { start: Date; end: Date }) => {
      let dateProperty: DateProperty;
      if (args.start === args.end) {
        dateProperty = createDatePropertyFromCalendarDate(args.start);
      } else {
        dateProperty = createDatePropertyFromCalendarDates(args.start, args.end);
        if (dateProperty.to === undefined) {
          return;
        }
      }

      const properties: Record<string, string> = {};
      if (dateDisplayProperty) {
        properties[dateDisplayProperty.id] = JSON.stringify(dateProperty);
      }

      addCard(properties);
    },
    [addCard, dateDisplayProperty]
  );

  const toolbar = useMemo(
    () => ({
      left: 'title',
      center: '',
      right: 'dayGridWeek dayGridMonth prev,today,next'
    }),
    []
  );

  const buttonText = useMemo(
    () => ({
      today: intl.formatMessage({ id: 'calendar.today', defaultMessage: 'Today' }),
      month: intl.formatMessage({ id: 'calendar.month', defaultMessage: 'Month' }),
      week: intl.formatMessage({ id: 'calendar.week', defaultMessage: 'Week' })
    }),
    []
  );

  const dayCellContent = useCallback(
    (args: DayCellContentArg): JSX.Element | null => {
      return (
        <div className='dateContainer'>
          {props.readOnly || props.disableAddingCards ? (
            <div></div>
          ) : (
            <div className='addEvent' onClick={() => onNewEvent({ start: args.date, end: args.date })}>
              <AddIcon color='secondary' />
            </div>
          )}
          <div className='dateDisplay'>{args.dayNumberText}</div>
        </div>
      );
    },
    [onNewEvent, props.readOnly, props.disableAddingCards]
  );

  return (
    <div className='CalendarContainer'>
      <FullCalendar
        dayCellContent={dayCellContent}
        dayMaxEventRows={5}
        initialDate={initialDate}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView='dayGridMonth'
        events={myEventsList}
        editable={isEditable}
        eventResizableFromStart={isEditable}
        headerToolbar={toolbar}
        buttonText={buttonText}
        eventClick={eventClick}
        eventContent={renderEventContent}
        eventChange={eventChange}
        selectable={isSelectable}
        selectMirror={true}
        select={onNewEvent}
        locale={userPreferences.locale ?? 'default'}
      />
    </div>
  );
}

export default CalendarFullView;
