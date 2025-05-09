import type { PostCategory } from '@charmverse/core/prisma';
import { Autocomplete, Box, Chip, TextField } from '@mui/material';
import type { HTMLAttributes } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';

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
  setCategoryId
}: {
  categoryId?: string | null;
  readOnly?: boolean;
  setCategoryId: (categoryId: string) => void;
}) {
  const { categories, getPostableCategories } = useForumCategories();

  const { space } = useCurrentSpace();

  const postCategory = categories?.find((category) => {
    if (!categoryId && space?.defaultPostCategoryId && category.id === space.defaultPostCategoryId) {
      updateForumPost(category);
      return true;
    } else if (categoryId) {
      return category.id === categoryId;
    } else {
      return false;
    }
  });

  const postableCategories = getPostableCategories();

  async function updateForumPost(_postCategory: PostCategory | null) {
    if (_postCategory) {
      setCategoryId(_postCategory.id);
    }
  }
  return (
    <PostCategoryAutocomplete
      value={postCategory ?? null}
      options={readOnly ? (categories ?? []) : postableCategories}
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
      onChange={(_event, _value) => {
        onChange(_value);
      }}
    />
  );
}
