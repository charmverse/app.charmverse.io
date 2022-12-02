import { Box, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/router';

import Link from 'components/common/Link';
import { useForumFilters } from 'hooks/useForumFilters';

import type { FilterProps } from './FilterSelect';

export default function FilterList({ categoryIdSelected, selectedCategory }: FilterProps) {
  const { getLinkUrl, categories, sortList, error } = useForumFilters();
  const { query } = useRouter();
  if (error) {
    return <Alert severity='error'>An error occured while loading the categories</Alert>;
  }

  return (
    <Card variant='outlined'>
      <CardContent>
        {/** TODO - Enable sorting 
        <Box display='flex' sx={{ alignItems: 'flex-start', flexDirection: 'column' }} gap={2}>
          {sortList.map((sort) => (
            <Link
              key={sort}
              href={getLinkUrl(sort)}
              sx={{ fontWeight: sort === query.sort ? 'bold' : 'initial' }}
              color='inherit'
            >
              {sort}
            </Link>
          ))}
        </Box>
                <Divider sx={{ pt: '10px', mb: '10px' }} />
        */}
        <Box display='flex' sx={{ alignItems: 'flex-start', flexDirection: 'column' }} gap={2}>
          <Typography
            key='all-categories'
            onClick={() => categoryIdSelected(undefined)}
            sx={{ fontWeight: selectedCategory === undefined ? 'bold' : 'initial' }}
            color='inherit'
          >
            All categories
          </Typography>
          {categories?.map((category) => (
            <Typography
              key={category.id}
              onClick={() => categoryIdSelected(category.id)}
              sx={{ fontWeight: selectedCategory === category.id ? 'bold' : 'initial' }}
              color='inherit'
            >
              {category.name}
            </Typography>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
