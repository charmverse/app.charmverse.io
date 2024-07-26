import { Chip } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { fancyTrim } from '@root/lib/utils/strings';
import Link from 'next/link';

import { Avatar } from 'components/common/Avatar';
import type { Grant } from 'lib/grants/getGrants';

export function GrantItem({ grant }: { grant: Grant }) {
  const grantName = grant.name || 'Untitled';

  return (
    <Card>
      <CardActionArea
        LinkComponent={Link}
        href={`/g/${grant.path}`}
        hrefLang='en'
        sx={{ display: 'flex', gap: 2, p: 2, alignItems: 'normal', justifyContent: 'flex-start' }}
      >
        {grant.logo ? (
          <CardMedia
            component='img'
            alt={grantName}
            src={grant.logo}
            sx={{ maxWidth: '100px', minWidth: '100px', height: '100px', borderRadius: 3 }}
          />
        ) : (
          <Avatar avatar={undefined} name={grantName} alt={grantName} size='xLarge' variant='rounded' />
        )}
        <CardContent
          component={Box}
          display='flex'
          justifyContent='space-between'
          flexDirection='column'
          alignItems='start'
          gap={1}
          sx={{ p: 0 }}
        >
          <Box>
            <Typography
              variant='h6'
              overflow='hidden'
              sx={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: '1'
              }}
            >
              {grantName}
            </Typography>
            <Typography
              variant='body2'
              overflow='hidden'
              sx={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: '2'
              }}
            >
              {fancyTrim(grant.description, 150)}
            </Typography>
          </Box>
          <Chip
            label={grant.open ? 'Open' : 'Closed'}
            variant='outlined'
            color={grant.open ? 'success' : 'error'}
            size='small'
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
