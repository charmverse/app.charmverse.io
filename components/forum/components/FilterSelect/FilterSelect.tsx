import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

import { ViewOptions } from 'components/common/ViewOptions';
import { useForumFilters } from 'hooks/useForumFilters';
import type { CategoryIdQuery } from 'lib/forums/posts/listForumPosts';

type Props = {
  selectedCategory?: CategoryIdQuery;
  categoryIdSelected: (categoryId: CategoryIdQuery) => void;

  // Unused prop for now
  // eslint-disable-next-line react/no-unused-prop-types
  sort?: any;
};

export default function FilterSelect({ categoryIdSelected, selectedCategory = 'none' }: Props) {
  const { query } = useRouter();
  function emitUpdate(category: CategoryIdQuery) {
    //   setSelected(category);
    categoryIdSelected(category);
  }

  const { categories, error } = useForumFilters();
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
    return <Alert severity='error'>An error occured while loading the categories</Alert>;
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
          value={selectedCategory}
          onChange={(e) => {
            emitUpdate(e.target.value);
          }}
        >
          <MenuItem value='none'>All categories</MenuItem>
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
