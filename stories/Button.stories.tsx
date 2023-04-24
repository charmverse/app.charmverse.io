import { Box, Button } from '@mui/material';

export default {
  title: 'common/Buttons',
  component: Button
};

export function Primary() {
  return (
    <Box display='flex' gap={4}>
      <Button>Default</Button>
      <Button variant='contained' color='error'>
        contained
      </Button>
      <Button variant='outlined' color='secondary'>
        outlined
      </Button>
      <Button variant='text'>text</Button>
    </Box>
  );
}
