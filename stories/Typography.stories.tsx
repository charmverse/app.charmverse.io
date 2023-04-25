import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';

export default {
  title: 'common/Typography',
  component: Typography
};

export function Primary() {
  return (
    <Box display='flex' gap={4}>
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
    </Box>
  );
}

export function PickFont() {
  const [fontFamily, setFontFamily] = useState('default');
  return (
    <Box className={`font-family-${fontFamily}`} px={2.5} mb={1}>
      <Typography variant='caption'>Style</Typography>
      <Box display='flex' mt={0.5}>
        <Button
          size='small'
          color={fontFamily === 'default' ? 'primary' : 'secondary'}
          variant='text'
          onClick={() => setFontFamily('default')}
        >
          <Box>Aa</Box>
          Default
        </Button>
        <Button
          size='small'
          color={fontFamily === 'serif' ? 'primary' : 'secondary'}
          variant='text'
          onClick={() => setFontFamily('serif')}
        >
          <Box className='font-family-serif'>Aa</Box>
          Serif
        </Button>
        <Button
          size='small'
          color={fontFamily === 'mono' ? 'primary' : 'secondary'}
          variant='text'
          onClick={() => setFontFamily('mono')}
        >
          <Box className='font-family-mono'>Aa</Box>
          Mono
        </Button>
      </Box>
      <Box display='flex' gap={4} mt={6}>
        <Typography>Default</Typography>
        <Typography variant='subtitle1'>Subtitle1</Typography>
        <Typography variant='body2'>Body2</Typography>
        <Typography variant='caption'>Caption</Typography>
      </Box>
    </Box>
  );
}
