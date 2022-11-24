import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { ViewOptions } from 'components/common/ViewOptions';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

const sortButtons = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'new', label: 'Newest post' },
  { value: 'latest', label: 'Latest Activity' }
];

export default function ForumFilters () {
  const { push, query } = useRouter();
  const currentSpace = useCurrentSpace();
  const querySort = query.filter;
  const queryCategory = query.category;

  const { data: categories, error } = useSWR(currentSpace ? '/forum/categories' : null, () => charmClient.forum.listPostCategories(currentSpace!.id));

  const handleClick = (value: string) => {
    const isValidSort = value && sortButtons.some(btn => btn.value === value);
    const isValidCategory = value && categories?.some(btn => btn === value);

    push({
      pathname: `/${query.domain}/forum`,
      ...(isValidSort && ({
        query: { filter: value }
      })),
      ...(isValidCategory && ({
        query: { category: value }
      }))
    }, undefined, { shallow: true });
  };

  const sortValue = useMemo(() => {
    if (querySort) {
      if (Array.isArray(querySort)) {
        return querySort[0];
      }
      else {
        return querySort;
      }
    }
  }, [querySort]);

  const categoryValue = useMemo(() => {
    if (queryCategory) {
      if (Array.isArray(queryCategory)) {
        return queryCategory[0] || 'none';
      }
      else {
        return queryCategory;
      }
    }
    return 'none';
  }, [queryCategory]);

  if (error) {
    return <Alert severity='error'>An error occured when loading categories</Alert>;
  }

  if (!categories) {
    return null;
  }

  return (
    <Box justifyContent='flex-start' flexWrap='wrap' sx={{ display: { xs: 'flex', md: 'none' } }}>
      <ViewOptions label='Sort' sx={{ mr: '10px', pb: '20px' }}>
        <Select
          value={sortValue || sortButtons[0].value}
          onChange={(e: SelectChangeEvent) => handleClick(e.target.value)}
        >
          {sortButtons.map(property => (
            <MenuItem key={property.label} value={property.value}>
              <Typography>{property.label}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
      <ViewOptions label='Categories' sx={{ pb: '20px' }}>
        <Select
          value={categoryValue}
          onChange={(e: SelectChangeEvent) => handleClick(e.target.value)}
        >
          <MenuItem value='none'>Select a category</MenuItem>
          {categories.map(category => (
            <MenuItem key={category} value={category}>
              <Typography>{category}</Typography>
            </MenuItem>
          ))}
        </Select>
      </ViewOptions>
    </Box>
  );
}
