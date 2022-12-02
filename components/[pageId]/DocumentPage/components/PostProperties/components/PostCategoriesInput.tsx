import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import type { PostCategory } from '@prisma/client';
import type { HTMLAttributes } from 'react';

import type { BrandColor } from 'theme/colors';

type PostCategoryOptionProps = {
  category: PostCategory;
  props: HTMLAttributes<HTMLLIElement>;
  onDelete?: (id: string) => void;
};

function PostCategoryOption({ props, category }: PostCategoryOptionProps) {
  return (
    <Box {...(props as unknown as HTMLAttributes<HTMLDivElement>)}>
      <Box justifyContent='space-between' alignItems='center' display='flex' flex={1}>
        <Chip
          variant='filled'
          color={category.color as BrandColor}
          label={category.name}
          sx={{ maxWidth: 150, flex: 1, display: 'flex', cursor: 'pointer' }}
        />
      </Box>
    </Box>
  );
}

type Props = {
  disabled?: boolean;
  options: PostCategory[];
  onChange: (value: PostCategory[]) => void;
};

export default function PostCategoryInput({ disabled, options, onChange }: Props) {
  return (
    <Autocomplete
      disabled={disabled}
      selectOnFocus
      clearOnBlur
      multiple
      filterSelectedOptions
      sx={{ minWidth: 150, width: '100%' }}
      options={options}
      renderOption={(_props, category) => <PostCategoryOption key={category.id} category={category} props={_props} />}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            label={option.name}
            {...getTagProps({ index })}
            key={option.id}
            color={option.color as BrandColor}
            disabled={disabled}
          />
        ))
      }
      getOptionLabel={(option) => option.name}
      noOptionsText='No categories available'
      renderInput={(params) => <TextField {...params} placeholder='Select category' size='small' />}
      onChange={(_event, _value) => onChange(_value)}
    />
  );
}
