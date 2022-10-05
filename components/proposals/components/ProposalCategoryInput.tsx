import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Chip, IconButton, TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import type { HTMLAttributes } from 'react';
import { useEffect, useRef, useMemo, useState } from 'react';

import type { NewProposalCategory, ProposalCategory } from 'lib/proposal/interface';
import type { BrandColor } from 'theme/colors';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

type TempOption = NewProposalCategory & {
  inputValue: string;
}

type OptionType = TempOption | ProposalCategory;

const filter = createFilterOptions<OptionType>();

type ProposalCategoryOptionProps = {
  category: OptionType;
  props: HTMLAttributes<HTMLLIElement>;
  onDelete?: (id: string) => void;
}

function ProposalCategoryOption ({ props, category, onDelete }: ProposalCategoryOptionProps) {
  if ('inputValue' in category) {
    return <li {...props}>{category.title}</li>;
  }

  const isCategory = 'color' in category;

  if (!isCategory) {
    return null;
  }

  return (
    <Box {...props as unknown as HTMLAttributes<HTMLDivElement>}>
      <Box justifyContent='space-between' alignItems='center' display='flex' flex={1}>
        <Chip variant='filled' color={category.color as BrandColor} label={category.title} sx={{ maxWidth: 150, flex: 1, display: 'flex', cursor: 'pointer' }} />

        {!!onDelete && (
          <IconButton
            color='secondary'
            size='small'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(category.id);
            }}
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

    </Box>
  );
}

type Props = {
  disabled?: boolean;
  options: OptionType[];
  value: ProposalCategory | null;
  canEditCategories?: boolean;
  onChange: (value: ProposalCategory | null) => void;
  onAddCategory?: (category: NewProposalCategory) => Promise<ProposalCategory>;
  onDeleteCategory?: (categoryId: string) => void;
};

export default function ProposalCategoryInput ({ disabled, options, canEditCategories, value, onChange, onAddCategory, onDeleteCategory }: Props) {
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
        <ProposalCategoryOption category={category} props={_props} onDelete={canEditCategories ? onDeleteCategory : undefined} />
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
      isOptionEqualToValue={(option, checkValue) => {
        if ('inputValue' in option) {
          return 'inputValue' in checkValue && option.inputValue === checkValue.inputValue;
        }

        if ('id' in option) {
          return 'id' in checkValue && option.id === checkValue.id;
        }

        return false;
      }}
      onChange={(_, values) => {
        onValueChange(values);
      }}
    />
  );
}
