import { Box, Grid2 as Grid } from '@mui/material';

import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCard } from '../Card/BuilderCard/BuilderCard';

export function BuildersGallery({
  builders,
  user,
  columns = 6,
  showHotIcon = false
}: {
  builders: BuilderInfo[];
  user?: { username: string } | null;
  columns?: number;
  showHotIcon?: boolean;
}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, md: columns }}>
        {builders.map((builder) => (
          <Grid key={builder.username} size={{ xs: 1 }}>
            <BuilderCard builder={builder} showPurchaseButton user={user} showHotIcon={showHotIcon} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
