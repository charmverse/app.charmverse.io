import { Box, Chip, TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import type { NewProposalCategory, ProposalCategory } from 'lib/proposal/interface';
import type { HTMLAttributes } from 'react';
import { useEffect, useRef, useMemo, useState } from 'react';
import type { BrandColor } from 'theme/colors';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

type TempOption = NewProposalCategory & {
  inputValue: string;
}

type OptionType = TempOption | ProposalCategory;

const filter = createFilterOptions<OptionType>();

type Props = {
  disabled?: boolean;
  options: OptionType[];
  value: ProposalCategory | null;
  canEditCategories?: boolean;
  onChange: (value: ProposalCategory | null) => void
  onAddCategory?: (category: NewProposalCategory) => Promise<ProposalCategory>
};

export default function ProposalCategoryInput ({ disabled, options, canEditCategories, value, onChange, onAddCategory }: Props) {
  const internalValue = useMemo(() => value ? [value] : [], [value]);
  const newCategoryColorRef = useRef(getRandomThemeColor());
  const [tempValue, setTempValue] = useState<TempOption| null>(null);

  useEffect(() => {
    if (tempValue && value) {
      setTempValue(null);
    }
  }, [value, tempValue]);

  async function onValueChange (values: OptionType[]) {
    const newValue = values.pop();

    if (newValue === undefined) {
      onChange(null);
      return;
    }

    if ('inputValue' in newValue && onAddCategory) {
      // Create a new value from the user input
      setTempValue(newValue);

      const newCategory = await onAddCategory({ color: newValue.color, title: newValue.inputValue });

      onChange(newCategory);
      newCategoryColorRef.current = getRandomThemeColor();
      return;
    }

    if ('id' in newValue) {
      onChange(newValue);
    }
  }

  return (
    <Autocomplete
      disabled={disabled}
      value={tempValue ? [tempValue] : internalValue}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      multiple
      filterSelectedOptions
      sx={{ minWidth: 150, width: '100%' }}
      options={options}
      autoHighlight
      clearIcon={null}
      renderOption={(_props, category) => (
        <ProposalCategoryOption category={category} props={_props} />
      )}
      ChipProps={{ color: (tempValue?.color || value?.color || 'gray') as BrandColor }}
      noOptionsText='No categories available'
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder='Select category'
          size='small'
          inputProps={{
            ...params.inputProps,
            // Hack hiding input for single-value tag input
            style: { opacity: tempValue || internalValue.length ? 0 : 1 }
          }}
        />
      )}
      getOptionLabel={(option: OptionType) => {
        // Add "xxx" option created dynamically
        if ('inputValue' in option) {
          return option.inputValue;
        }
        // Regular option
        return option.title;
      }}
      filterOptions={(allOptions: OptionType[], params) => {
        const filtered = filter(allOptions, params);

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some((option) => inputValue === option.title);
        if (inputValue !== '' && !isExisting && canEditCategories && onAddCategory) {
          filtered.push({
            inputValue,
            title: `Add "${inputValue}"`,
            color: newCategoryColorRef.current
          });
        }

        return filtered;
      }}
      onChange={(_, values) => {
        onValueChange(values);
      }}
    />
  );
}

type ProposalCategoryOptionProps = {
  category: OptionType;
  props: HTMLAttributes<HTMLLIElement>;
}

function ProposalCategoryOption ({ props, category }: ProposalCategoryOptionProps) {
  if ('inputValue' in category) {
    return <li {...props}>{category.title}</li>;
  }

  const isCategory = 'color' in category;

  if (!isCategory) {
    return null;
  }

  return (
    <Box {...props as unknown as HTMLAttributes<HTMLDivElement>}>
      <Chip variant='filled' color={category.color as BrandColor} label={category.title} sx={{ maxWidth: 150, flex: 1, display: 'flex', cursor: 'pointer' }} />
    </Box>
  );
}
