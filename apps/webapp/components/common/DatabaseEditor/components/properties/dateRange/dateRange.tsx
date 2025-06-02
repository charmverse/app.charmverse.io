import { styled, Box, Divider, Popover, TextField } from '@mui/material';
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { Utils } from '@packages/databases/utils';
import { DateTime } from 'luxon';
import { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRef, useState } from 'react';
import { useIntl } from 'react-intl';

import { Button } from 'components/common/Button';
import { useDateFormatter } from 'hooks/useDateFormatter';

import Checkbox from '../../../widgets/checkbox';
import { EmptyPlaceholder } from '../EmptyPlaceholder';

const PickersDayContainer = styled('div')`
  &.highlighted {
    background-color: var(--charmeditor-active);
    border-radius: 0;

    &.start-date {
      border-bottom-left-radius: 50%;
      border-top-left-radius: 50%;
    }
    &.end-date {
      border-bottom-right-radius: 50%;
      border-top-right-radius: 50%;
    }
  }
  div {
    border: 2px solid transparent;
  }
  .MuiPickersDay-root {
    margin: 0;
    transform: scale(1.1);
  }
`;

type Props = {
  className?: string;
  value: string;
  showEmptyPlaceholder?: boolean;
  onChange: (value: string) => void;
  wrapColumn?: boolean;
  centerContent?: boolean;
};

export type DateProperty = {
  from?: number;
  to?: number;
  includeTime?: boolean;
  timeZone?: string;
};

export function createDatePropertyFromString(initialValue: string): DateProperty {
  let dateProperty: DateProperty = {};
  if (initialValue) {
    const singleDate = new Date(Number(initialValue));
    if (singleDate && DateTime.fromJSDate(singleDate).isValid) {
      dateProperty.from = singleDate.getTime();
    } else {
      try {
        dateProperty = JSON.parse(initialValue);
      } catch {
        // Don't do anything, return empty dateProperty
      }
    }
  }
  return dateProperty;
}

function timeZoneOffset(date: number): number {
  return new Date(date).getTimezoneOffset() * 60 * 1000;
}

function DateRangePicker(props: Props) {
  const { formatDate } = useDateFormatter();
  const [focusedInput, setFocusedInput] = useState<'from' | 'to'>('from');
  const toInputRef = useRef<HTMLInputElement>(null);
  const intl = useIntl();
  const popupState = usePopupState({ variant: 'popover', popupId: 'dateRangePopup' });
  const { className, value, showEmptyPlaceholder, onChange } = props;
  const [dateProperty, setDateProperty] = useState<DateProperty>(createDatePropertyFromString(value as string));

  function getDisplayDate(date: DateTime | null | undefined) {
    let displayDate = '';
    if (date) {
      displayDate = formatDate(date.toJSDate(), { withYear: true });
    }
    return displayDate;
  }

  // Keep dateProperty as UTC,
  // dateFrom / dateTo will need converted to local time, to ensure date stays consistent
  // dateFrom / dateTo will be used for input and calendar dates
  const dateFrom = dateProperty.from
    ? DateTime.fromMillis(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.from)))
    : undefined;
  const dateTo = dateProperty.to
    ? DateTime.fromMillis(dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.to)))
    : undefined;
  const [fromInput, setFromInput] = useState<string>(getDisplayDate(dateFrom));
  const [toInput, setToInput] = useState<string>(getDisplayDate(dateTo));

  const isRange = dateTo !== undefined;

  let displayValue = '';
  if (dateFrom) {
    displayValue = getDisplayDate(dateFrom);
  }
  if (dateTo) {
    displayValue += ` → ${getDisplayDate(dateTo)}`;
  }

  function saveRangeValue(range: DateProperty) {
    const rangeUTC = { ...range };
    if (rangeUTC.from) {
      rangeUTC.from -= dateProperty.includeTime ? 0 : timeZoneOffset(rangeUTC.from);
    }
    if (rangeUTC.to) {
      rangeUTC.to -= dateProperty.includeTime ? 0 : timeZoneOffset(rangeUTC.to);
    }

    setDateProperty(rangeUTC);
    setFromInput(getDisplayDate(range.from ? DateTime.fromMillis(range.from) : undefined));
    setToInput(getDisplayDate(range.to ? DateTime.fromMillis(range.to) : undefined));
  }

  function handleDayClick(selected: DateTime | null) {
    if (!selected) {
      // not sure when this happens
      return;
    }
    const range: DateProperty = { from: dateFrom?.toMillis(), to: dateTo?.toMillis() };
    if (focusedInput === 'from') {
      // if start is after end, set end to start
      if (dateTo && dateTo < selected) {
        range.from = dateTo.toMillis();
        range.to = selected.toMillis();
      } else {
        range.from = selected.toMillis();
      }
      setFocusedInput('to');
    } else {
      if (dateFrom && dateFrom > selected) {
        range.from = selected.toMillis();
        range.to = dateFrom.toMillis();
      } else {
        range.to = selected.toMillis();
      }
      setFocusedInput('from');
    }
    saveRangeValue(range);
  }

  function onRangeClick() {
    let range: DateProperty = {
      from: dateFrom?.toMillis(),
      to: dateFrom?.toMillis()
    };
    if (isRange) {
      range = {
        from: dateFrom?.toMillis(),
        to: undefined
      };
    }
    saveRangeValue(range);
    // grab input in setTimeout since it doesnt exist otherwise
    setTimeout(() => {
      if (!isRange) {
        toInputRef.current?.focus();
      }
    });
  }

  function onClear() {
    saveRangeValue({});
    popupState.close();
  }

  function onClose() {
    // not actually setting here,
    // but using to retreive the current state
    setDateProperty((current) => {
      if (current && current.from) {
        onChange(JSON.stringify(current));
      } else {
        onChange('');
      }
      return { ...current };
    });
    popupState.close();
  }

  return (
    <div style={{ width: '100%' }}>
      <Box
        display='flex'
        alignItems={props.centerContent ? 'center' : 'flex-start'}
        className='octo-propertyvalue'
        data-testid='select-non-editable'
        onClick={(e) => {
          if (!dateFrom) {
            // add default start date
            saveRangeValue({
              from: DateTime.local().toMillis(),
              to: undefined
            });
          }
          popupState.open(e);
        }}
        // {...bindTrigger(popupState)}
        style={{ minHeight: '20px', minWidth: '25px' }}
      >
        {displayValue || (!displayValue && !showEmptyPlaceholder) ? (
          <span style={{ whiteSpace: props.wrapColumn ? 'break-spaces' : 'nowrap' }}>{displayValue}</span>
        ) : (
          <EmptyPlaceholder>Empty</EmptyPlaceholder>
        )}
      </Box>
      <Popover {...bindPopover(popupState)} onClose={onClose}>
        <Box display='flex' p={1} gap={1}>
          <TextField
            autoFocus
            fullWidth={!dateTo}
            sx={{ width: dateTo ? '148px' : undefined }}
            size='small'
            value={fromInput || ''}
            InputProps={{ className: isRange && focusedInput === 'from' ? 'Mui-focused' : undefined }}
            placeholder={formatDate(new Date(), { withYear: true })}
            onFocus={() => {
              setFocusedInput('from');
              if (dateFrom) {
                return setFromInput(Utils.inputDate(dateFrom.toJSDate(), intl));
              }
              return undefined;
            }}
            onChange={(e) => setFromInput(e.target.value)}
            onBlur={() => {
              const newDate = new Date(formatDate(fromInput, { withYear: true }));
              if (newDate && DateTime.fromJSDate(newDate).isValid) {
                newDate.setHours(12);
                const range: DateProperty = {
                  from: newDate.getTime(),
                  to: dateTo?.toMillis()
                };
                saveRangeValue(range);
              } else {
                setFromInput(getDisplayDate(dateFrom));
              }
            }}
          />
          {dateTo && (
            <TextField
              size='small'
              inputRef={toInputRef}
              sx={{ width: '148px' }}
              value={toInput || ''}
              InputProps={{ className: focusedInput === 'to' ? 'Mui-focused' : undefined }}
              placeholder={formatDate(new Date(), { withYear: true })}
              onFocus={() => {
                setFocusedInput('to');
                if (dateTo) {
                  return setToInput(Utils.inputDate(dateTo.toJSDate(), intl));
                }
                return undefined;
              }}
              onChange={(e) => setToInput(e.target.value)}
              onBlur={() => {
                const newDate = new Date(formatDate(fromInput, { withYear: true }));
                if (newDate && DateTime.fromJSDate(newDate).isValid) {
                  newDate.setHours(12);
                  const range: DateProperty = {
                    from: dateFrom?.toMillis(),
                    to: newDate.getTime()
                  };
                  saveRangeValue(range);
                } else {
                  setToInput(getDisplayDate(dateTo));
                }
              }}
            />
          )}
        </Box>
        <StaticDatePicker
          // selectedSections={{ startIndex: 5, endIndex: 9 }}
          // value={dateFrom}
          // onChange={handleDayClick}
          closeOnSelect={false}
          slots={{
            // @ts-ignore
            day: CalendarDaySlot,
            toolbar: HiddenElement,
            actionBar: HiddenElement
          }}
          slotProps={{
            day: {
              // @ts-ignore passing in custom props
              dateFrom,
              dateTo,
              // @ts-ignore use onClick instead of onChange, since onChange does not trigger when clicking the current date. but with date range, we have two dates to consider
              onClick: handleDayClick
            }
          }}
        />
        <Divider sx={{ my: 0 }} />
        <Box px={2} py={2}>
          <Checkbox displayType='calendar' label='End date' isOn={isRange} onChanged={onRangeClick} />
        </Box>
        <Divider sx={{ my: 0 }} />
        <Box px={2} py={1}>
          <Button color='inherit' size='small' variant='text' onClick={onClear}>
            Clear
          </Button>
        </Box>
      </Popover>
    </div>
  );
}

function CalendarDaySlot(
  props: PickersDayProps<DateTime> & {
    dateFrom?: DateTime;
    dateTo?: DateTime;
    onClick?: (date: DateTime) => void;
  }
) {
  const { day, dateFrom, dateTo, onClick, outsideCurrentMonth } = props;

  const isRange = !!dateTo;

  const isStartDate = dateFrom?.hasSame(day, 'day');
  const isEndDate = dateTo?.hasSame(day, 'day');
  const isSelected = isStartDate || isEndDate;
  const isHighlighted = dateFrom && dateTo && dateFrom <= day && dateTo >= day;
  return (
    <PickersDayContainer
      className={
        !outsideCurrentMonth && isRange && (isHighlighted || isSelected)
          ? `highlighted${isStartDate ? ' start-date' : ''}${isEndDate ? ' end-date' : ''}`
          : ''
      }
    >
      <div>
        <PickersDay {...props} onClick={() => onClick?.(day)} selected={isSelected} />
      </div>
    </PickersDayContainer>
  );
}

function HiddenElement() {
  return <div />;
}

export default DateRangePicker;

// source: https://github.com/gpbl/react-day-picker/blob/a75a5b669dbe98d25da035b69d2f2786ffe8b935/src/contexts/SelectRange/utils/addToRange.ts#L11
function addToRange(day: DateTime, range: { from: DateTime; to: DateTime }): { from: DateTime; to: DateTime } {
  const { from, to } = range || {};
  if (to.hasSame(day, 'day') && from.hasSame(day, 'day')) {
    return range;
  }
  if (to.hasSame(day, 'day')) {
    return { from: day, to: day };
  }
  if (from.hasSame(day, 'day')) {
    return { from: day, to: day };
  }
  if (from > day) {
    return { from: day, to };
  }
  return { from, to: day };
}
