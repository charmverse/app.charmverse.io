import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import startCase from 'lodash/startCase';

import Link from 'components/common/Link';
import { ViewOptions } from 'components/common/ViewOptions';
import { useForumCategories } from 'hooks/useForumCategories';
import type { PostSortOption } from '@packages/lib/forums/posts/constants';
import { postSortOptions } from '@packages/lib/forums/posts/constants';

export type FilterProps = {
  selectedCategoryId?: string | null;
  selectedSort?: PostSortOption | null;
};

export function CategorySelect({ selectedCategoryId = 'all-category', selectedSort }: FilterProps) {
  const { categories, error } = useForumCategories();
  const currentCategory = categories.find((category) => category.id === selectedCategoryId);

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  return (
    <Box display='flex' justifyContent='flex-start' flexWrap='wrap'>
      <ViewOptions label='Sort' sx={{ mr: '10px', pb: '20px' }}>
        <Select value={selectedSort ?? 'new'}>
          {postSortOptions.map((s) => (
            <MenuItem
              key={s}
              component={Link}
              href={`/forum${currentCategory ? `/${currentCategory.path}` : ''}?sort=${s}`}
            >
              <Typography>{startCase(s.replace('_', ' '))}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
      <ViewOptions label='Categories' sx={{ pb: '20px' }}>
        <Select
          value={selectedCategoryId}
          renderValue={(value) => (
            <Typography color='inherit'>
              {value === 'all-category' ? 'All categories' : categories?.find((c) => c.id === value)?.name}
            </Typography>
          )}
        >
          <MenuItem component={Link} href='/forum'>
            <Typography sx={{ fontWeight: !selectedCategoryId ? 'bold' : 'initial' }} color='inherit'>
              All categories
            </Typography>
          </MenuItem>
          {categories?.map((category) => (
            <MenuItem key={category.id} component={Link} href={`/forum/${category.path}`}>
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
