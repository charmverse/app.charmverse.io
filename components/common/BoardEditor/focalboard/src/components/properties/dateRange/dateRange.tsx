import { Divider, Popover } from '@mui/material';
import { DateTime } from 'luxon';
import { bindPopover, bindTrigger } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import { DateUtils } from 'react-day-picker';
import DayPicker from 'react-day-picker/DayPicker';
import { useIntl } from 'react-intl';

import { useDateFormatter } from 'hooks/useDateFormatter';
import { useUserPreferences } from 'hooks/useUserPreferences';

import { Utils } from '../../../utils';
import Button from '../../../widgets/buttons/button';
import Editable from '../../../widgets/editable';
import Label from '../../../widgets/label';
import SwitchOption from '../../../widgets/menu/switchOption';

import 'react-day-picker/lib/style.css';

type Props = {
  className: string;
  value: string;
  showEmptyPlaceholder?: boolean;
  onChange: (value: string) => void;
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
    if (singleDate && DateUtils.isDate(singleDate)) {
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

function DateRange(props: Props): JSX.Element {
  const { className, value, showEmptyPlaceholder, onChange } = props;
  const intl = useIntl();
  const popupState = usePopupState({ variant: 'popover', popupId: 'dateRangePopup' });
  const { formatDate } = useDateFormatter();

  const getDisplayDate = (date: Date | null | undefined) => {
    let displayDate = '';
    if (date) {
      displayDate = formatDate(date);
    }
    return displayDate;
  };

  const timeZoneOffset = (date: number): number => {
    return new Date(date).getTimezoneOffset() * 60 * 1000;
  };

  const [dateProperty, setDateProperty] = useState<DateProperty>(createDatePropertyFromString(value as string));

  // Keep dateProperty as UTC,
  // dateFrom / dateTo will need converted to local time, to ensure date stays consistent
  // dateFrom / dateTo will be used for input and calendar dates
  const dateFrom = dateProperty.from
    ? new Date(dateProperty.from + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.from)))
    : undefined;
  const dateTo = dateProperty.to
    ? new Date(dateProperty.to + (dateProperty.includeTime ? 0 : timeZoneOffset(dateProperty.to)))
    : undefined;
  const [fromInput, setFromInput] = useState<string>(getDisplayDate(dateFrom));
  const [toInput, setToInput] = useState<string>(getDisplayDate(dateTo));

  const isRange = dateTo !== undefined;

  const { userPreferences } = useUserPreferences();
  const locale = userPreferences.locale ?? intl.locale;

  const saveRangeValue = (range: DateProperty) => {
    const rangeUTC = { ...range };
    if (rangeUTC.from) {
      rangeUTC.from -= dateProperty.includeTime ? 0 : timeZoneOffset(rangeUTC.from);
    }
    if (rangeUTC.to) {
      rangeUTC.to -= dateProperty.includeTime ? 0 : timeZoneOffset(rangeUTC.to);
    }

    setDateProperty(rangeUTC);
    setFromInput(getDisplayDate(range.from ? new Date(range.from) : undefined));
    setToInput(getDisplayDate(range.to ? new Date(range.to) : undefined));
  };

  const handleDayClick = (day: Date) => {
    const range: DateProperty = {};
    if (isRange) {
      const newRange = DateUtils.addDayToRange(day, { from: dateFrom, to: dateTo });
      range.from = newRange.from?.getTime();
      range.to = newRange.to?.getTime();
    } else {
      range.from = day.getTime();
      range.to = undefined;
    }
    saveRangeValue(range);
  };

  const onRangeClick = () => {
    let range: DateProperty = {
      from: dateFrom?.getTime(),
      to: dateFrom?.getTime()
    };
    if (isRange) {
      range = {
        from: dateFrom?.getTime(),
        to: undefined
      };
    }
    saveRangeValue(range);
  };

  const onClear = () => {
    saveRangeValue({});
  };

  let displayValue = '';
  if (dateFrom) {
    displayValue = getDisplayDate(dateFrom);
  }
  if (dateTo) {
    displayValue += ` → ${getDisplayDate(dateTo)}`;
  }

  const onClose = () => {
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
  };

  let buttonText = displayValue;
  if (!buttonText && showEmptyPlaceholder) {
    buttonText = intl.formatMessage({ id: 'DateRange.empty', defaultMessage: 'Empty' });
  }

  return (
    <>
      <div className='octo-propertyvalue' data-testid='select-non-editable' {...bindTrigger(popupState)}>
        <Label color={displayValue ? 'propColorDefault' : 'empty'}>
          <span className='Label-text'>{buttonText}</span>
        </Label>
      </div>
      <Popover {...bindPopover(popupState)} onClose={onClose} PaperProps={{ sx: { p: 2, fontSize: 14 } }}>
        <div className={`DateRange ${className}-overlayWrapper`}>
          <div className={`${className}-overlay`}>
            <div className='inputContainer'>
              <Editable
                value={fromInput}
                placeholderText={DateTime.local().setLocale(locale).toFormat('DD/MM/YYYY')}
                onFocus={() => {
                  if (dateFrom) {
                    return setFromInput(Utils.inputDate(dateFrom, intl));
                  }
                  return undefined;
                }}
                onChange={setFromInput}
                onSave={() => {
                  const newDate = DateTime.fromFormat(fromInput, 'DD/MM/YYYY', { locale: intl.locale }).toJSDate();
                  if (newDate && DateUtils.isDate(newDate)) {
                    newDate.setHours(12);
                    const range: DateProperty = {
                      from: newDate.getTime(),
                      to: dateTo?.getTime()
                    };
                    saveRangeValue(range);
                  } else {
                    setFromInput(getDisplayDate(dateFrom));
                  }
                }}
                onCancel={() => {
                  setFromInput(getDisplayDate(dateFrom));
                }}
              />
              {dateTo && (
                <Editable
                  value={toInput}
                  placeholderText={DateTime.local().setLocale(locale).toFormat('DD/MM/YYYY')}
                  onFocus={() => {
                    if (dateTo) {
                      return setToInput(Utils.inputDate(dateTo, intl));
                    }
                    return undefined;
                  }}
                  onChange={setToInput}
                  onSave={() => {
                    const newDate = DateTime.fromFormat(fromInput, 'DD/MM/YYYY', {
                      locale: intl.locale
                    }).toJSDate();
                    if (newDate && DateUtils.isDate(newDate)) {
                      newDate.setHours(12);
                      const range: DateProperty = {
                        from: dateFrom?.getTime(),
                        to: newDate.getTime()
                      };
                      saveRangeValue(range);
                    } else {
                      setToInput(getDisplayDate(dateTo));
                    }
                  }}
                  onCancel={() => {
                    setToInput(getDisplayDate(dateTo));
                  }}
                />
              )}
            </div>
            <DayPicker
              onDayClick={handleDayClick}
              initialMonth={dateFrom || new Date()}
              showOutsideDays={false}
              locale={locale}
              todayButton={intl.formatMessage({ id: 'DateRange.today', defaultMessage: 'Today' })}
              onTodayButtonClick={handleDayClick}
              month={dateFrom}
              selectedDays={[dateFrom, dateTo ? { from: dateFrom, to: dateTo } : { from: dateFrom, to: dateFrom }]}
              modifiers={dateTo ? { start: dateFrom, end: dateTo } : { start: dateFrom, end: dateFrom }}
            />
            <Divider sx={{ my: 1 }} />
            <SwitchOption
              key='EndDateOn'
              id='EndDateOn'
              name={intl.formatMessage({ id: 'DateRange.endDate', defaultMessage: 'End date' })}
              isOn={isRange}
              onClick={onRangeClick}
            />
            <Divider sx={{ my: 1 }} />
            <div className='MenuOption menu-option'>
              <Button onClick={onClear}>
                {intl.formatMessage({ id: 'DateRange.clear', defaultMessage: 'Clear' })}
              </Button>
            </div>
          </div>
        </div>
      </Popover>
    </>
  );
}

export default DateRange;
