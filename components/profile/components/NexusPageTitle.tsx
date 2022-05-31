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
        mb: 3,
        fontSize: {
          xs: '1.5em',
          sm: '2rem'
        }
      }}
    >
      {subPage ? (
        <>
          <Link color='secondary' href='/profile/tasks' sx={{ display: 'flex', alignItems: 'center' }}>
            <ChevronLeft />
            {MyNexus}
          </Link>
          <Divider sx={{ borderRightWidth: '2px' }} orientation='vertical' flexItem />
          <Box component='span' alignItems='center' sx={{ fontWeight: 'bold' }}>
            {subPage}
          </Box>
        </>
      ) : <Box component='span' sx={{ fontWeight: 'bold' }}>{MyNexus}</Box>}
    </Typography>
  );

}
