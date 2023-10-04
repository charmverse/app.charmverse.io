import { RPCList } from 'connectors/index';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { RewardType } from 'components/rewards/components/RewardProperties/interfaces';
import type { IPropertyOption } from 'lib/focalboard/board';

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  value: number | null;
  onChange: (value: number) => void;
};

export const chainOptions: IPropertyOption<string>[] = RPCList.map((chain) => ({
  id: chain.chainId.toString(),
  value: chain.chainName,
  color: 'grey'
}));

export function ChainSelect({ readOnly, readOnlyMessage, value, onChange }: Props) {
  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    if (newValue) {
      onChange(Number(newValue));
    }
  }

  return (
    <TagSelect
      wrapColumn
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      options={chainOptions}
      propertyValue={String(value)}
      onChange={onValueChange}
    />
  );
}
