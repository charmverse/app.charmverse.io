import Box from '@mui/material/Box';
import { LoadingComponent } from '@packages/scoutgame/components/common/Loading/LoadingComponent';

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
