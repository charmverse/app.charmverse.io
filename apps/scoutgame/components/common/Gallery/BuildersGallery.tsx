import { Box, Grid2 as Grid } from '@mui/material';

import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCard } from '../Card/BuilderCard/BuilderCard';

export function BuildersGallery({ builders, user }: { builders: BuilderInfo[]; user?: { username: string } | null }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 6 }}>
        {builders.map((builder) => (
          <Grid key={builder.username} size={{ xs: 1 }}>
            <BuilderCard builder={builder} showPurchaseButton user={user} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
