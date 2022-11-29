import { Box } from '@mui/material';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import { useRouter } from 'next/router';

import Link from 'components/common/Link';
import { useForumFilters } from 'hooks/useForumFilters';

export default function FilterList() {
  const { getLinkUrl, categories, sortList, error } = useForumFilters();
  const { query } = useRouter();

  if (error) {
    return <Alert severity='error'>An error occured while loading the categories</Alert>;
  }

  return (
    <Card variant='outlined'>
      <CardContent>
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
        <Box display='flex' sx={{ alignItems: 'flex-start', flexDirection: 'column' }} gap={2}>
          {categories?.map((category) => (
            <Link
              key={category.id}
              href={getLinkUrl(category.name)}
              sx={{ fontWeight: category.name === query.category ? 'bold' : 'initial' }}
              color='inherit'
            >
              {category.name}
            </Link>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
