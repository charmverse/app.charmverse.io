import { Autocomplete, Box, Chip, Stack, TextField, Typography } from '@mui/material';
import type { PostCategory } from '@prisma/client';
import type { HTMLAttributes } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';

type PostCategoryOptionProps = {
  category: PostCategory;
  props: HTMLAttributes<HTMLLIElement>;
  onDelete?: (id: string) => void;
};

// <Stack
// gap={1}
// sx={{
//   '& .MuiInputBase-input': {
//     background: 'none'
//   },
//   my: 2
// }}
// >
export function PostCategoryInput({
  categoryId,
  readOnly,
  spaceId,
  setCategoryId
}: {
  categoryId: string | null;
  readOnly?: boolean;
  spaceId?: string;
  setCategoryId: (categoryId: string) => void;
}) {
  const { data: categories } = useSWR(spaceId ? `spaces/${spaceId}/post-categories` : null, () =>
    charmClient.forum.listPostCategories(spaceId!)
  );

  const postCategory = categories?.find((category) => category.id === categoryId);

  async function updateForumPost(_postCategory: PostCategory | null) {
    if (_postCategory) {
      setCategoryId(_postCategory.id);
    }
  }
  return (
    <PostCategoryAutocomplete
      value={postCategory ?? null}
      options={categories ?? []}
      disabled={readOnly}
      onChange={updateForumPost}
    />
  );
}

function PostCategoryOption({ props, category }: PostCategoryOptionProps) {
  return (
    <Box {...(props as unknown as HTMLAttributes<HTMLDivElement>)}>
      <Box justifyContent='space-between' alignItems='center' display='flex' flex={1}>
        <Chip
          variant='filled'
          label={category.name}
          sx={{ maxWidth: 150, flex: 1, display: 'flex', cursor: 'pointer' }}
        />
      </Box>
    </Box>
  );
}

type AutocompleteProps = {
  disabled?: boolean;
  options: PostCategory[];
  onChange: (value: PostCategory | null) => void;
  value: PostCategory | null;
};

function PostCategoryAutocomplete({ disabled, options, onChange, value }: AutocompleteProps) {
  return (
    <Autocomplete
      value={value}
      disabled={disabled}
      selectOnFocus
      clearOnBlur
      filterSelectedOptions
      sx={{ minWidth: 150, width: '100%' }}
      options={options}
      renderOption={(_props, category) => <PostCategoryOption key={category.id} category={category} props={_props} />}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip label={option.name} {...getTagProps({ index })} key={option.id} disabled={disabled} />
        ))
      }
      getOptionLabel={(option) => option.name}
      noOptionsText='No categories available'
      renderInput={(params) => <TextField {...params} placeholder='Choose a category' size='small' />}
      onChange={(_event, _value) => onChange(_value)}
    />
  );
}
