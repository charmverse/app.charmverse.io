import { Box, Typography } from '@mui/material';

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
