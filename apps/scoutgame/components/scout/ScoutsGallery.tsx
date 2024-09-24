import { Box, Grid2 as Grid } from '@mui/material';

import type { ScoutInfo } from './ScoutCard';
import { ScoutCard } from './ScoutCard';

export function ScoutsGallery({ scouts }: { scouts: ScoutInfo[] }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 6 }}>
        {scouts.map((scout) => (
          <Grid key={scout.username} size={{ xs: 1, sm: 2, md: 3, lg: 2 }}>
            <ScoutCard scout={scout} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
