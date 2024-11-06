import { Container } from '@mui/material';

import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';
import type { DailyClaim } from 'lib/claims/getDailyClaims';

import { DailyClaimGallery } from './components/DailyClaimGallery/DailyClaimGallery';

export function QuestsPage({ dailyClaims }: { dailyClaims: DailyClaim[] }) {
  return (
    <>
      <InfoBackgroundImage />
      <Container maxWidth='lg' sx={{ px: 5 }}>
        <DailyClaimGallery dailyClaims={dailyClaims} />
      </Container>
    </>
  );
}
