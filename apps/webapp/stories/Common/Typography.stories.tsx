import { Box, Button, Paper } from '@mui/material';
import { useState } from 'react';

import { Typography } from 'components/common/Typography';

export default {
  title: 'common/Typography',
  component: Typography
};

export function Primary() {
  return (
    <Paper sx={{ p: 4 }}>
      <Box display='flex' flexDirection='column' gap={4}>
        <Typography>Default</Typography>
        <Typography variant='subtitle1'>Subtitle1</Typography>
        <Typography variant='body2'>Body2</Typography>
        <Typography variant='caption'>Caption</Typography>
        <Typography variant='h1'>h1</Typography>
        <Typography variant='h2'>h2</Typography>
        <Typography variant='h3'>h3</Typography>
        <Typography variant='h4'>h4</Typography>
        <Typography variant='h5'>h5</Typography>
        <Typography variant='h6'>h6</Typography>
        <Box maxWidth={75} whiteSpace='nowrap'>
          <Typography overflowEllipsis>Elipsis on typo</Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export function CustomFonts() {
  const [fontFamily, setFontFamily] = useState('default');
  return (
    <Paper sx={{ p: 4 }}>
      <Box className={`font-family-${fontFamily}`} px={2.5} mb={1}>
        <Typography variant='caption'>Pick font</Typography>
        <Box display='flex' mt={0.5} gap={2}>
          <Button
            size='small'
            color={fontFamily === 'default' ? 'primary' : 'secondary'}
            variant='outlined'
            onClick={() => setFontFamily('default')}
          >
            <Box mr={1}>Aa</Box>
            Default
          </Button>
          <Button
            size='small'
            color={fontFamily === 'serif' ? 'primary' : 'secondary'}
            variant='outlined'
            onClick={() => setFontFamily('serif')}
          >
            <Box mr={1} className='font-family-serif'>
              Aa
            </Box>
            Serif
          </Button>
          <Button
            size='small'
            color={fontFamily === 'mono' ? 'primary' : 'secondary'}
            variant='outlined'
            onClick={() => setFontFamily('mono')}
          >
            <Box mr={1} className='font-family-mono'>
              Aa
            </Box>
            Mono
          </Button>
        </Box>
        <Box display='flex' gap={4} mt={6}>
          <Typography variant='subtitle1'>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged.
          </Typography>
          <Typography variant='body2'>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged.
          </Typography>
          <Typography variant='caption'>
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
            industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into
            electronic typesetting, remaining essentially unchanged.{' '}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
