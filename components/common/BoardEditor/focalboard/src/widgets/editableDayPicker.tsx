import { DateTime } from 'luxon';
import React, { useState } from 'react';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import { Utils } from '../utils';

import 'react-day-picker/lib/style.css';

type Props = {
    className: string;
    value: string;
    onChange: (value: string | undefined) => void;
}

const parseValue = (value: string): Date | undefined => {
  return value ? new Date(parseInt(value, 10)) : undefined;
};

const displayDate = (date: Date | undefined, intl: IntlShape): string | undefined => {
  if (date === undefined) {
    return undefined;
  }
  return Utils.displayDate(date, intl);
};

const dateFormat = 'MM/DD/YYYY';

function EditableDayPicker (props: Props): JSX.Element {
  const { className, onChange } = props;
  const intl = useIntl();
  const [value, setValue] = useState(() => parseValue(props.value));
  const [dayPickerVisible, setDayPickerVisible] = useState(false);

  const locale = intl.locale.toLowerCase();

  const saveSelection = () => {
    onChange(value?.getTime().toString());
  };

  const inputValue = dayPickerVisible ? value : displayDate(value, intl);

  const parseDate = (str: string, format: string, withLocale: string) => {
    if (str === inputValue) {
      return value;
    }
    return DateTime.fromFormat(str, format, { locale: withLocale }).toJSDate();
  };

  const formatDate = (date: Date, format: string, withLocale: string) => {
    return DateTime.fromJSDate(date).setLocale(withLocale).toFormat(format);
  };

  return (
    <div className={`EditableDayPicker ${className}`}>
      <DayPickerInput
        value={inputValue}
        onDayChange={(day: Date) => setValue(day)}
        onDayPickerShow={() => setDayPickerVisible(true)}
        onDayPickerHide={() => {
          setDayPickerVisible(false);
          saveSelection();
        }}
        inputProps={{
          onKeyUp: (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              saveSelection();
            }
          }
        }}
        dayPickerProps={{
          locale,
          todayButton: intl.formatMessage({ id: 'EditableDayPicker.today', defaultMessage: 'Today' })
        }}
        formatDate={formatDate}
        parseDate={parseDate}
        format={dateFormat}
        placeholder={dateFormat}
      />
    </div>
  );
}

export default EditableDayPicker;
