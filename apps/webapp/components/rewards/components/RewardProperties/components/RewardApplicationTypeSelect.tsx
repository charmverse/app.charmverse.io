import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';
import type { IPropertyOption } from '@packages/databases/board';
import type { RewardApplicationType } from '@packages/lib/rewards/getApplicationType';

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
  },
  {
    id: 'assigned_kyc' as const,
    value: 'Assigned + KYC',
    color: 'blue'
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
