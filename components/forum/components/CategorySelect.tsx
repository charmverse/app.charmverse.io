import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import startCase from 'lodash/startCase';

import { ViewOptions } from 'components/common/ViewOptions';
import { useForumCategories } from 'hooks/useForumCategories';
import { postSortOptions } from 'lib/forums/posts/constants';
import type { PostOrder } from 'lib/forums/posts/listForumPosts';

type FilterProps = {
  selectedCategory?: string;
  handleCategory: (categoryId?: string) => void;
  sort?: PostOrder;
  handleSort: (sort?: PostOrder) => void;
};

export function CategorySelect({ handleCategory, selectedCategory, handleSort, sort }: FilterProps) {
  const { categories, error } = useForumCategories();

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  return (
    <Box display='flex' justifyContent='flex-start' flexWrap='wrap'>
      <ViewOptions label='Sort' sx={{ mr: '10px', pb: '20px' }}>
        <Select value={sort ?? 'newest'} onChange={(e) => handleSort(e.target.value as PostOrder)}>
          {postSortOptions.map((s) => (
            <MenuItem key={s} value={s}>
              <Typography>{startCase(s.replace('_', ' '))}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
      <ViewOptions label='Categories' sx={{ pb: '20px' }}>
        <Select
          value={selectedCategory ?? 'all-category'}
          onChange={(e) => {
            handleCategory(e.target.value);
          }}
        >
          <MenuItem value='all-category'>
            <Typography sx={{ fontWeight: selectedCategory?.length === 0 ? 'bold' : 'initial' }} color='inherit'>
              All categories
            </Typography>
          </MenuItem>
          {categories?.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              <Typography
                key={category.id}
                sx={{ fontWeight: selectedCategory === category.id ? 'bold' : 'initial' }}
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
