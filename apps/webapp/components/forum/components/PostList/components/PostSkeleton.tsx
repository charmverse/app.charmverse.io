import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import Avatar from 'components/common/Avatar';

export function PostSkeleton() {
  return (
    <Card variant='outlined' sx={{ mb: '15px' }}>
      <CardActionArea>
        <CardContent>
          <Typography variant='h6' variantMapping={{ h6: 'h3' }} gutterBottom>
            <Skeleton />
          </Typography>
          <Skeleton sx={{ height: 190 }} animation='wave' variant='rectangular' />
          <Box display='flex' flexDirection='row' justifyContent='space-between' mt='16px'>
            <Box display='flex' alignItems='center'>
              <Skeleton variant='circular'>
                <Avatar sx={{ width: 24, height: 24 }} avatar={null} />
              </Skeleton>
              <Typography variant='h5' variantMapping={{ h6: 'h3' }} width='170px' marginLeft='10px'>
                <Skeleton />
              </Typography>
            </Box>
            <Box display='flex' alignItems='center'>
              <Typography variant='h5' variantMapping={{ h6: 'h3' }} width='70px'>
                <Skeleton />
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
