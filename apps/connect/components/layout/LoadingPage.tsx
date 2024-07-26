import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import Box from '@mui/material/Box';

export function LoadingPage() {
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
