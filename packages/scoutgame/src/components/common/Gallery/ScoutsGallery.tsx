import { Box, Grid2 as Grid } from '@mui/material';
import type { ScoutInfo } from '@packages/scoutgame/components/common/Card/ScoutCard';
import { ScoutCard } from '@packages/scoutgame/components/common/Card/ScoutCard';
import Link from 'next/link';

export function ScoutsGallery({ scouts }: { scouts: ScoutInfo[] }) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 2, sm: 6, md: 3 }}>
        {scouts.map((scout) => (
          <Grid key={scout.path} size={{ xs: 1 }}>
            <Link href={`/u/${scout.path}`}>
              <ScoutCard scout={scout} />
            </Link>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
