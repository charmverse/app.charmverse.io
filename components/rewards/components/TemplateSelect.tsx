import { fancyTrim } from '@packages/utils/strings';

import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';

const maxTitleLength = 35;

type TemplateOption = {
  id: string;
  title: string;
};

type Props<T> = {
  disabled?: boolean;
  displayType?: 'details';
  options: T[];
  value?: string | null;
  onChange: (value: T | null) => void;
};

export function TemplateSelect<T extends TemplateOption>({
  disabled,
  displayType,
  options,
  value,
  onChange
}: Props<T>) {
  const propertyOptions = options.map((option) => ({
    id: option.id,
    color: 'gray',
    value: fancyTrim(option.title || 'Untitled', maxTitleLength)
  }));

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
      wrapColumn
      data-test='proposal-template-select'
      showEmpty
      displayType={displayType}
      readOnly={disabled}
      options={propertyOptions}
      noOptionsText={value ? 'No more options available for this category' : 'No options available for this category'}
      propertyValue={value || ''}
      onChange={onValueChange}
    />
  );
}
