import { Box, Typography } from '@mui/material';

export function StarterPackInfo({ remainingStarterCards = 3 }: { remainingStarterCards?: number }) {
  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <Typography variant='h5' color='secondary' fontWeight={600} textAlign='center'>
        Scout your Starter Pack
      </Typography>
      <Typography variant='h6' textAlign='center'>
        Scout up to {remainingStarterCards} Builders in this Starter Set <br />
        Starter Cards at 20 points (up to 95% off)
      </Typography>
      <Typography textAlign='center'>* Starter Cards earn 1/10th the points of Season Cards.</Typography>
    </Box>
  );
}
