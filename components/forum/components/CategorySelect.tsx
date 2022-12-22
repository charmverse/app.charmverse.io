import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';

import { ViewOptions } from 'components/common/ViewOptions';
import { useForumCategories } from 'hooks/useForumCategories';

export type FilterProps = {
  selectedCategory?: string;
  categoryIdSelected: (categoryId?: string) => void;
  // Unused prop for now
  // eslint-disable-next-line react/no-unused-prop-types
  sort?: any;
};

export function CategorySelect({ categoryIdSelected, selectedCategory = 'all-category' }: FilterProps) {
  const { categories, error } = useForumCategories();
  // Unused for now
  // const sortValue = useMemo(() => {
  //   const defaultValue = sortList[0];
  //   if (querySort) {
  //     if (Array.isArray(querySort)) {
  //       return querySort[0] || defaultValue;
  //     } else {
  //       return querySort;
  //     }
  //   }
  //   return defaultValue;
  // }, [querySort]);

  if (error) {
    return <Alert severity='error'>An error occurred while loading the categories</Alert>;
  }

  return (
    <Box justifyContent='flex-start' flexWrap='wrap'>
      {/*
      Re-enable when we allow sorting in the app
      <ViewOptions label='Sort' sx={{ mr: '10px', pb: '20px' }}>
        <Select disabled={disabled} value={sortValue} onChange={(e: SelectChangeEvent) => handleClick(e.target.value)}>
          {sortList.map((sort) => (
            <MenuItem key={sort} value={sort}>
              <Typography>{sort}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions> */}
      <ViewOptions label='Categories' sx={{ pb: '20px' }}>
        <Select
          value={!selectedCategory || selectedCategory?.length === 0 ? 'all-category' : selectedCategory}
          onChange={(e) => {
            categoryIdSelected(e.target.value);
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
