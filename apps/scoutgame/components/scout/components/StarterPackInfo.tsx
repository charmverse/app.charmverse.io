import { Box, Typography } from '@mui/material';

export function StarterPackInfo({ builders = 3 }: { builders?: number }) {
  return (
    <Box>
      <Typography variant='h4' color='secondary' fontWeight={600} textAlign='center'>
        Scout your Starter Pack
      </Typography>
      <Typography variant='h5' textAlign='center'>
        Scout up to {builders} Builders in this Starter Set <br />
        Starter Cards at 20 point (up to 95% off)
      </Typography>
      <Typography>* Starter Cards earn 1/10th the points of Season Cards.</Typography>
    </Box>
  );
}
