import Link from 'components/common/Link';
import { Box, Divider, Typography } from '@mui/material';
import ChevronLeft from '@mui/icons-material/ChevronLeft';

export default function PageTitle ({ subPage }: { subPage?: string }) {

  const MyNexus = 'My Nexus';

  return (
    <Typography
      variant='h1'
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        mb: 3
      }}
    >
      {subPage ? (
        <>
          <Link color='secondary' href='/profile'>
            <ChevronLeft />
            {MyNexus}
          </Link>
          <Divider orientation='vertical' flexItem color='secondary' />
          <Box component='span' alignItems='center' sx={{ fontWeight: 'bold' }}>
            {subPage}
          </Box>
        </>
      ) : <Box component='span' sx={{ fontWeight: 'bold' }}>{MyNexus}</Box>}
    </Typography>
  );

}
