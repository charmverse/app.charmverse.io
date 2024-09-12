import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';
import { InfoWrapper } from 'components/layout/InfoWrapper';

export function LoginPage() {
  return (
    <InfoWrapper>
      <Box
        display='flex'
        flexDirection='column'
        alignItems='center'
        maxWidth='100vw'
        border='none'
        borderRadius='0'
        textAlign='center'
        bgcolor='transparent'
        sx={{
          display: 'flex',
          flexDirection: 'column',
          my: 0,
          justifyContent: 'space-evenly',
          alignItems: 'center',
          minHeight: 'calc(100svh - 100px)'
        }}
      >
        <Image
          src='/images/scout-game-logo-square.png'
          width={400}
          height={200}
          sizes='100vw'
          style={{
            width: '100%',
            maxWidth: '400px',
            height: 'auto'
          }}
          alt='ScoutGame'
        />
        <Box>
          <Typography variant='h5' mb={2} fontWeight='700'>
            Scout. Build. Win.
          </Typography>
        </Box>
        <Box display='flex' flexDirection='column' gap={3} width='100%'>
          <WarpcastLogin />
        </Box>
      </Box>
    </InfoWrapper>
  );
}
