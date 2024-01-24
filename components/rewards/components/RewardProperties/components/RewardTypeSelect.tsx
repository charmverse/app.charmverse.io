import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';

export const rewardTypeOptions: IPropertyOption[] = [
  {
    id: 'Token' as const,
    value: 'Token',
    color: 'teal'
  },
  {
    id: 'Custom' as const,
    value: 'Custom',
    color: 'yellow'
  },
  {
    id: 'None' as const,
    value: 'None',
    color: 'red'
  }
];

export type RewardType = (typeof rewardTypeOptions)[number]['id'];

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
      wrapColumn
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      options={rewardTypeOptions}
      propertyValue={value}
      onChange={onValueChange}
    />
  );
}
