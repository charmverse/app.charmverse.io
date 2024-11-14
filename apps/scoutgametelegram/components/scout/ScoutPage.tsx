import { Stack, Typography } from '@mui/material';
import { HeaderMessage } from '@packages/scoutgame-ui/components/common/Header/HeaderMessage';
import { TodaysHotBuildersCarousel } from '@packages/scoutgame-ui/components/home/TodaysHotBuildersCarousel/TodaysHotBuildersCarousel';

export function ScoutPage() {
  return (
    <Stack>
      <HeaderMessage />
      <Typography variant='h4' color='secondary' textAlign='center' fontWeight='bold' my={2}>
        Scout today's HOT Builders!
      </Typography>
      <TodaysHotBuildersCarousel />
    </Stack>
  );
}
