import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { ProposalCategory } from 'lib/proposal/interface';

type Props = {
  readOnly?: boolean;
  readOnlyMessage?: string;
  options: ProposalCategory[];
  value: ProposalCategory | null;
  onChange: (value: ProposalCategory | null) => void;
};

export function ProposalCategorySelect({ readOnly, readOnlyMessage, options, value, onChange }: Props) {
  const propertyOptions = options.map((option) => ({
    id: option.id,
    value: option.title,
    color: option.color
  }));

  const propertyValue = value?.id ?? '';

  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    const option = options.find(({ id }) => id === newValue);
    if (option === undefined) {
      onChange(null);
    } else if ('id' in option) {
      onChange(option);
    }
  }
  return (
    <TagSelect
      data-test='proposal-category-select'
      wrapColumn
      readOnly={readOnly}
      readOnlyMessage={readOnlyMessage}
      options={propertyOptions}
      propertyValue={propertyValue}
      onChange={onValueChange}
    />
  );
}
