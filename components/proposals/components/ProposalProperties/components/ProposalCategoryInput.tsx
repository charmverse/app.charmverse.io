import { Box, Chip, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import type { HTMLAttributes } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { TagSelect } from 'components/common/BoardEditor/components/properties/TagSelect/TagSelect';
import type { NewProposalCategory, ProposalCategory } from 'lib/proposal/interface';
import type { BrandColor } from 'theme/colors';
import { brandColorNames } from 'theme/colors';

type TempOption = NewProposalCategory & {
  inputValue: string;
};

type OptionType = TempOption | ProposalCategory;

type ProposalCategoryOptionProps = {
  category: OptionType;
  props: HTMLAttributes<HTMLLIElement>;
};

function ProposalCategoryOption({ props, category }: ProposalCategoryOptionProps) {
  if ('inputValue' in category) {
    return <li {...props}>{category.title}</li>;
  }

  const isCategory = 'color' in category;

  if (!isCategory) {
    return null;
  }

  return (
    <Box {...(props as unknown as HTMLAttributes<HTMLDivElement>)}>
      <Box justifyContent='space-between' alignItems='center' display='flex' flex={1}>
        <Chip
          variant='filled'
          color={brandColorNames.includes(category.color as BrandColor) ? (category.color as BrandColor) : undefined}
          label={`${category.title}`}
          sx={{ maxWidth: 150, flex: 1, display: 'flex', cursor: 'pointer' }}
        />
      </Box>
    </Box>
  );
}

type Props = {
  disabled?: boolean;
  options: OptionType[];
  value: ProposalCategory | null;
  onChange: (value: ProposalCategory | null) => void;
};

export function ProposalCategoryInput({ disabled, options, value, onChange }: Props) {
  const internalValue = useMemo(() => (value ? [value] : []), [value]);
  const [tempValue, setTempValue] = useState<TempOption | null>(null);

  useEffect(() => {
    if (tempValue && value) {
      setTempValue(null);
    }
  }, [value, tempValue]);

  function onValueChange(values: string | string[]) {
    const newValue = Array.isArray(values) ? values[0] : values;
    const option = options.find(({ title }) => title === newValue);
    onChange(option || null);
  }

  const colorToDisplay = tempValue?.color || value?.color || 'gray';

  const propertyOptions = options.map((option) => ({
    id: option.title,
    value: option.title,
    color: option.color
  }));

  const propertyValue = value?.title || [];

  return (
    <TagSelect
      wrapColumn
      readOnly={disabled}
      options={propertyOptions}
      propertyValue={propertyValue}
      onChange={onValueChange}
    />
  );

  // return (
  //   <Autocomplete
  //     disabled={disabled}
  //     value={tempValue ? [tempValue] : internalValue}
  //     selectOnFocus
  //     clearOnBlur
  //     handleHomeEndKeys
  //     multiple
  //     filterSelectedOptions
  //     sx={{ minWidth: 150, width: '100%' }}
  //     options={options}
  //     autoHighlight
  //     clearIcon={null}
  //     renderOption={(_props, category) => (
  //       <ProposalCategoryOption category={category} props={_props} key={category.title} />
  //     )}
  //     ChipProps={{
  //       // Avoids a bug where an error is thrown if the color is unsupported
  //       color: brandColorNames.includes(colorToDisplay as BrandColor) ? (colorToDisplay as BrandColor) : undefined,
  //       // Hack for preventing delete from showing
  //       onDelete: null as any
  //     }}
  //     noOptionsText='No categories available'
  //     renderInput={(params) => (
  //       <TextField
  //         {...params}
  //         placeholder='Select category'
  //         size='small'
  //         inputProps={{
  //           ...params.inputProps,
  //           // Hack hiding input for single-value tag input
  //           style: { opacity: tempValue || internalValue.length ? 0 : 1 }
  //         }}
  //       />
  //     )}
  //     getOptionLabel={(option: OptionType) => {
  //       // Regular option
  //       return option?.title;
  //     }}
  //     isOptionEqualToValue={(option, checkValue) => {
  //       if ('inputValue' in option) {
  //         return 'inputValue' in checkValue && option.inputValue === checkValue.inputValue;
  //       }

  //       if ('id' in option) {
  //         return 'id' in checkValue && option.id === checkValue.id;
  //       }

  //       return false;
  //     }}
  //     onChange={(_, values) => {
  //       onValueChange(values);
  //     }}
  //   />
  // );
}
