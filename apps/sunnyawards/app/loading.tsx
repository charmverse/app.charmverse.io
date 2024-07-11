import { LoadingComponent } from 'components/common/LoadingComponent';
import Box from '@mui/material/Box';

export default function Loading() {
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
      <LoadingComponent isLoading size={80} />
    </Box>
  );
}
