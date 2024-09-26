import { Box, Grid2 as Grid, Skeleton, Stack } from '@mui/material';

export function LoadingGallery({ quantity = 10 }: { quantity?: number }) {
  return (
    <Box sx={{ flexGrow: 1, height: '100%' }}>
      <Grid container spacing={{ xs: 1, sm: 2 }} columns={{ xs: 3, sm: 6 }}>
        {Array.from({ length: quantity }).map((_, index) => (
          <Grid key={`loading-card-${index.toString()}`} size={{ xs: 1 }}>
            <Stack spacing={0.25}>
              <Skeleton animation='wave' variant='rectangular' height={175} sx={{ borderRadius: '5px' }} />
              <Skeleton animation='wave' variant='rectangular' height={50} sx={{ borderRadius: '5px' }} />
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
