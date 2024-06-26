import Bolt from '@connect/public/images/lightning_bolt.svg';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

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
      <Typography variant='subtitle1'>The page you are looking for does not exist!</Typography>
    </Box>
  );
}
