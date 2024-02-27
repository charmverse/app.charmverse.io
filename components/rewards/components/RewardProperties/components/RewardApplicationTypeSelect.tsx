import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from 'lib/focalboard/board';
import type { RewardApplicationType } from 'lib/rewards/getApplicationType';

export const rewardTypeOptions: IPropertyOption[] = [
  {
    id: 'application_required' as const,
    value: 'Application required',
    color: 'teal'
  },
  {
    id: 'direct_submission' as const,
    value: 'Direct submission',
    color: 'yellow'
  },
  {
    id: 'assigned' as const,
    value: 'Assigned',
    color: 'green'
  }
];

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  value: RewardApplicationType;
  onChange: (value: RewardApplicationType) => void;
};

export function RewardApplicationTypeSelect({ readOnly, readOnlyMessage, value, onChange }: Props) {
  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      onChange(newValue as RewardApplicationType);
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
