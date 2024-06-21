import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Bolt from 'public/images/lightning_bolt.svg';

export default function NotFound() {
  return (
    <Box
      height='100vh'
      width='100%'
      display='flex'
      alignItems='center'
      justifyContent='center'
      overflow='hidden'
      flexDirection='column'
      gap={5}
    >
      <Bolt />
      <Typography variant='subtitle1'>Sorry! there was an error</Typography>
    </Box>
  );
}
