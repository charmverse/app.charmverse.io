import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { RewardType } from 'components/rewards/components/RewardProperties/interfaces';
import type { IPropertyOption } from 'lib/focalboard/board';

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  value: RewardType;
  onChange: (value: RewardType) => void;
};

export const rewardTypeOptions: IPropertyOption<RewardType>[] = [
  {
    id: 'Token',
    value: 'Token',
    color: 'teal'
  },
  {
    id: 'Custom',
    value: 'Custom',
    color: 'yellow'
  }
];

export function RewardTypeSelect({ readOnly, readOnlyMessage, value, onChange }: Props) {
  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      onChange(newValue as RewardType);
    }
  }

  return (
    <TagSelect
      wrapColumn
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      options={rewardTypeOptions}
      propertyValue={value}
      onChange={onValueChange}
    />
  );
}
