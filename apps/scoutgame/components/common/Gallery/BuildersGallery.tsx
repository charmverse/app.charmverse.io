import { Box, Grid2 as Grid } from '@mui/material';

import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCard } from '../Card/BuilderCard/BuilderCard';

export function BuildersGallery({
  builders,
  user,
  columns = 6,
  showHotIcon = false,
  size = 'medium'
}: {
  builders: BuilderInfo[];
  columns?: number;
  showHotIcon?: boolean;
  user?: { username: string; id: string } | null;
  size?: 'small' | 'medium' | 'large';
}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container rowSpacing={2} columns={{ xs: 2, md: columns }}>
        {builders.map((builder) => (
          <Grid key={builder.username} size={{ xs: 1 }}>
            <BuilderCard builder={builder} showPurchaseButton user={user} showHotIcon={showHotIcon} size={size} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
