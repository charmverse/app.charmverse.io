import { Box, Typography } from '@mui/material';
import Image from 'next/image';

import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

export default async function Home() {
  return (
    <Box component='main' bgcolor='background.default' p={{ md: 3 }} height='100%' minHeight='100dvh'>
      <InfoBackgroundImage />
      <Box
        position='relative'
        height='100%'
        maxWidth='700px'
        margin='auto'
        display='flex'
        sx={{
          alignItems: 'center',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
        data-test='welcome-page'
      >
        <Image
          src='/images/scout-game-logo-square.png'
          width={300}
          height={150}
          sizes='100vw'
          style={{
            width: '100%',
            maxWidth: '300px',
            height: 'auto'
          }}
          alt='ScoutGame'
          priority
        />
        <Typography
          variant='h5'
          textAlign='center'
          sx={{
            mb: 4,
            fontWeight: 700,
            backgroundColor: 'black',
            px: 1
          }}
        >
          Fantasy sports for onchain builders
        </Typography>
      </Box>
    </Box>
  );
}
