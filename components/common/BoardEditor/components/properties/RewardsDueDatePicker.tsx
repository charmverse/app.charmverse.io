import { DateTime } from 'luxon';

import { DateTimePicker } from 'components/common/DateTimePicker';
import { useRewards } from 'components/rewards/hooks/useRewards';

export function RewardsDueDatePicker({
  value,
  disabled,
  rewardId,
  onChange
}: {
  value: string | number;
  disabled?: boolean;
  rewardId: string;
  onChange?: (value: DateTime | null) => void;
}) {
  const { updateReward } = useRewards();
  return (
    <DateTimePicker
      variant='card_property'
      minDate={DateTime.fromMillis(Date.now())}
      value={
        typeof value === 'number'
          ? DateTime.fromMillis(value)
          : value.toString()
          ? DateTime.fromISO(value.toString())
          : null
      }
      disabled={disabled}
      disablePast
      onAccept={(_value) =>
        onChange?.(_value) ??
        updateReward({
          rewardId,
          updateContent: {
            dueDate: _value?.toJSDate() || undefined
          }
        })
      }
      onChange={(_value) =>
        onChange?.(_value) ??
        updateReward({
          rewardId,
          updateContent: {
            dueDate: _value?.toJSDate() || undefined
          }
        })
      }
    />
  );
}
