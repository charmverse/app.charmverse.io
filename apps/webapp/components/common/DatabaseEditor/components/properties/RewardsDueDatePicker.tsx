import { DateTime } from 'luxon';

import { DateTimePicker } from 'components/common/DateTimePicker';

export function RewardsDueDatePicker({
  value,
  disabled,
  onChange,
  onAccept
}: {
  value: string | number | null;
  disabled?: boolean;
  onChange?: (value: DateTime | null) => void;
  onAccept?: (value: DateTime | null) => void;
}) {
  return (
    <DateTimePicker
      variant='card_property'
      minDate={DateTime.fromMillis(Date.now())}
      value={
        typeof value === 'number'
          ? DateTime.fromMillis(value)
          : value?.toString()
            ? DateTime.fromISO(value.toString())
            : null
      }
      disabled={disabled}
      disablePast
      onAccept={onAccept}
      onChange={onChange}
    />
  );
}
