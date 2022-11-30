import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

import { ViewOptions } from 'components/common/ViewOptions';
import { useForumFilters } from 'hooks/useForumFilters';

export default function FilterSelect() {
  const { query } = useRouter();
  const querySort = query.sort;
  const queryCategory = query.category;

  const { disabled, handleClick, categories, sortList, error } = useForumFilters();

  const sortValue = useMemo(() => {
    const defaultValue = sortList[0];
    if (querySort) {
      if (Array.isArray(querySort)) {
        return querySort[0] || defaultValue;
      } else {
        return querySort;
      }
    }
    return defaultValue;
  }, [querySort]);

  const categoryValue = useMemo(() => {
    if (queryCategory) {
      if (Array.isArray(queryCategory)) {
        return queryCategory[0] || 'none';
      } else {
        return queryCategory;
      }
    }
    return 'none';
  }, [queryCategory]);

  if (error) {
    return <Alert severity='error'>An error occured while loading the categories</Alert>;
  }

  return (
    <Box justifyContent='flex-start' flexWrap='wrap'>
      <ViewOptions label='Sort' sx={{ mr: '10px', pb: '20px' }}>
        <Select disabled={disabled} value={sortValue} onChange={(e: SelectChangeEvent) => handleClick(e.target.value)}>
          {sortList.map((property) => (
            <MenuItem key={property} value={property}>
              <Typography>{property}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
      <ViewOptions label='Categories' sx={{ pb: '20px' }}>
        <Select value={categoryValue} onChange={(e: SelectChangeEvent) => handleClick(e.target.value)}>
          <MenuItem value='none'>Select a category</MenuItem>
          {categories?.map((category) => (
            <MenuItem key={category.name} value={category.name}>
              <Typography>{category.name}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
    </Box>
  );
}
