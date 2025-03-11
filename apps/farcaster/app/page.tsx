import { Typography } from '@mui/material';
import { PageWrapper } from '@packages/connect-shared/components/common/PageWrapper';

export default async function Home() {
  return (
    <PageWrapper>
      <Typography variant='h6'>Hello from CharmVerse</Typography>
    </PageWrapper>
  );
}
