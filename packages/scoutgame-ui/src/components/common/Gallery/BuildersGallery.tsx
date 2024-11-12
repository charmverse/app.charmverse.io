import { Box, Grid2 as Grid, Typography } from '@mui/material';
import type { BuilderInfo } from '@packages/scoutgame/builders/interfaces';

import { BuilderCard } from 'components/common/Card/BuilderCard/BuilderCard';

export function BuildersGallery({
  builders,
  columns = 6,
  showHotIcon = false,
  size = 'medium'
}: {
  builders: BuilderInfo[];
  columns?: number;
  showHotIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        container
        rowSpacing={2}
        columns={{ xs: 2, sm: 3, md: builders.length < columns ? builders.length : columns }}
      >
        {builders.map((builder) => (
          <Grid key={builder.path} size={{ xs: 1 }} display='flex' justifyContent='center' alignItems='center'>
            <Box>
              {builder.nftsSoldToScout !== undefined && builder.nftsSoldToScout > 0 && (
                <Typography color='green.main' textAlign='right' mb={1}>
                  X {builder.nftsSoldToScout ?? 0}
                </Typography>
              )}
              <BuilderCard builder={builder} showPurchaseButton showHotIcon={showHotIcon} size={size} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
