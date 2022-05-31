import Link from 'components/common/Link';
import { Box, Divider, Typography } from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';

export default function PageTitle ({ title }: { title: string }) {

  return (
    <Typography variant='h1' sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mb: 3 }}>
      <Link color='inherit' href='/profile'>
        <ChevronLeft />
        My Nexus
      </Link><Divider orientation='vertical' flexItem color='secondary' />
      <Box alignItems='center' style={{ position: 'relative', top: '-2px', fontSize: '.7em' }}>
        {title}
      </Box>
    </Typography>
  );

}
