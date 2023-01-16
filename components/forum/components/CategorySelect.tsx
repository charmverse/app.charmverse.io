import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import startCase from 'lodash/startCase';

import { ViewOptions } from 'components/common/ViewOptions';
import { useForumCategories } from 'hooks/useForumCategories';
import type { PostSortOption } from 'lib/forums/posts/constants';
import { postSortOptions } from 'lib/forums/posts/constants';

export type FilterProps = {
  selectedCategoryId?: string | null;
  handleCategory: (categoryId?: string) => void;
  selectedSort?: PostSortOption | null;
  handleSort: (sort?: PostSortOption) => void;
};

export function CategorySelect({ handleCategory, selectedCategoryId, handleSort, selectedSort }: FilterProps) {
  const { categories, error } = useForumCategories();

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  return (
    <Box display='flex' justifyContent='flex-start' flexWrap='wrap'>
      <ViewOptions label='Sort' sx={{ mr: '10px', pb: '20px' }}>
        <Select value={selectedSort ?? 'newest'} onChange={(e) => handleSort(e.target.value as PostSortOption)}>
          {postSortOptions.map((s) => (
            <MenuItem key={s} value={s}>
              <Typography>{startCase(s.replace('_', ' '))}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
      <ViewOptions label='Categories' sx={{ pb: '20px' }}>
        <Select
          value={selectedCategoryId ?? 'all-category'}
          onChange={(e) => {
            handleCategory(e.target.value);
          }}
          renderValue={(value) => (
            <Typography color='inherit'>
              {value === 'all-category' ? 'All categories' : categories?.find((c) => c.id === value)?.name}
            </Typography>
          )}
        >
          <MenuItem value='all-category'>
            <Typography sx={{ fontWeight: !selectedCategoryId ? 'bold' : 'initial' }} color='inherit'>
              All categories
            </Typography>
          </MenuItem>
          {categories?.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              <Typography
                key={category.id}
                sx={{ fontWeight: selectedCategoryId === category.id ? 'bold' : 'initial' }}
                color='inherit'
              >
                {category.name}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
    </Box>
  );
}
