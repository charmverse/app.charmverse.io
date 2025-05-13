import { InputLabel, MenuItem, Select, Stack } from '@mui/material';

export type CommentSortType = 'latest' | 'top';

export function CommentSort({
  commentSort,
  setCommentSort
}: {
  setCommentSort: (sort: CommentSortType) => void;
  commentSort: CommentSortType;
}) {
  return (
    <Stack flexDirection='row' alignItems='center' gap={1}>
      <InputLabel>Sort</InputLabel>
      <Select
        variant='outlined'
        value={commentSort}
        size='small'
        onChange={(e) => setCommentSort(e.target.value as CommentSortType)}
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
