import { InputLabel, MenuItem, Select, Stack } from '@mui/material';
import type { Dispatch, SetStateAction } from 'react';

export type PostCommentSort = 'latest' | 'top';

export function PostCommentSort({
  commentSort,
  setCommentSort
}: {
  setCommentSort: Dispatch<SetStateAction<PostCommentSort>>;
  commentSort: PostCommentSort;
}) {
  return (
    <Stack flexDirection='row' alignItems='center' gap={1}>
      <InputLabel>Sort</InputLabel>
      <Select
        variant='outlined'
        value={commentSort}
        size='small'
        onChange={(e) => setCommentSort(e.target.value as PostCommentSort)}
      >
        {['latest', 'top'].map((sort) => (
          <MenuItem dense key={sort} value={sort}>
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </MenuItem>
        ))}
      </Select>
    </Stack>
  );
}
