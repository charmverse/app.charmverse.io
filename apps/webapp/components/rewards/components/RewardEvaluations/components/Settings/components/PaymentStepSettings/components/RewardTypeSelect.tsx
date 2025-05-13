import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from '@packages/databases/board';
import type { RewardType } from '@packages/lib/rewards/interfaces';

export const rewardTypeOptions: IPropertyOption[] = [
  {
    id: 'token' as RewardType,
    value: 'Token',
    color: 'teal'
  },
  {
    id: 'custom' as RewardType,
    value: 'Custom',
    color: 'yellow'
  },
  {
    id: 'none' as RewardType,
    value: 'None',
    color: 'gray'
  }
];

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  value: RewardType;
  onChange: (value: RewardType) => void;
};

export function RewardTypeSelect({ readOnly, readOnlyMessage, value, onChange }: Props) {
  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      onChange(newValue as RewardType);
    }
  }

  return (
    <TagSelect
      data-test='reward-type-select'
      wrapColumn
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      options={rewardTypeOptions}
      propertyValue={value}
      onChange={onValueChange}
    />
  );
}
