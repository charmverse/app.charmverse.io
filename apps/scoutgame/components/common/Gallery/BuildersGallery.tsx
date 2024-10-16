import { Box, Grid2 as Grid, Typography } from '@mui/material';

import type { BuilderInfo } from 'lib/builders/interfaces';

import { BuilderCard } from '../Card/BuilderCard/BuilderCard';

export function BuildersGallery({
  builders,
  columns = 6,
  showHotIcon = false,
  size = 'medium',
  userId
}: {
  builders: BuilderInfo[];
  columns?: number;
  showHotIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
  userId?: string;
}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        rowSpacing={2}
        columns={{ xs: 2, sm: 3, md: builders.length < columns ? builders.length : columns }}
      >
        {builders.map((builder) => (
          <Grid key={builder.username} size={{ xs: 1 }} display='flex' justifyContent='center' alignItems='center'>
            <Box>
              {builder.nftsSoldToScout !== undefined && builder.nftsSoldToScout > 0 && (
                <Typography color='orange.main' textAlign='right' mb={1}>
                  X {builder.nftsSoldToScout ?? 0}
                </Typography>
              )}
              <BuilderCard builder={builder} showPurchaseButton showHotIcon={showHotIcon} size={size} userId={userId} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
