import { Box } from '@mui/material';
import { fancyTrim } from '@packages/utils/strings';

import { PropertyLabel } from 'components/common/DatabaseEditor/components/properties/PropertyLabel';
import { TagSelect } from 'components/common/DatabaseEditor/components/properties/TagSelect/TagSelect';

const maxTitleLength = 35;
type TemplateOption = {
  id: string;
  title: string;
};
type Props<T> = {
  displayType?: 'details';
  options: T[];
  required?: boolean;
  value?: string | null;
  onChange?: (value: T | null) => void;
  readOnly?: boolean;
};
export function TemplateSelect<T extends TemplateOption>({
  displayType,
  options,
  required,
  value,
  onChange,
  readOnly
}: Props<T>) {
  const propertyOptions = (options || []).map((template) => ({
    id: template.id,
    color: 'gray',
    value: fancyTrim(template.title || 'Untitled', maxTitleLength)
  }));

  function onValueChange(values: string | string[]) {
    if (!onChange) return;

    const newValue = Array.isArray(values) ? values[0] : values;
    const option = options.find(({ id }) => id === newValue);
    if (option === undefined) {
      onChange(null);
    } else if ('id' in option) {
      onChange(option);
    }
  }

  return (
    <Box className='CardDetail' mb={1}>
      <Box className='octo-propertyrow' mb='0 !important' display='flex' justifyContent='space-between'>
        <PropertyLabel readOnly highlighted required={required}>
          Template
        </PropertyLabel>
        <Box display='flex' flex={1}>
          <TagSelect
            data-test='proposal-template-select'
            showEmpty
            wrapColumn
            displayType={displayType}
            readOnly={readOnly}
            options={propertyOptions}
            noOptionsText={
              value ? 'No more options available for this category' : 'No options available for this category'
            }
            propertyValue={value || ''}
            onChange={onValueChange}
          />
        </Box>
      </Box>
    </Box>
  );
}
