import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import { Typography } from '@mui/material';

import { WarpcastLogin } from 'components/common/WarpcastLogin/WarpcastLogin';

export default async function Home() {
  return (
    <PageWrapper>
      <Typography variant='h2'>Waitlist</Typography>
      <Typography variant='h6'>Welcome to our app</Typography>

      <WarpcastLogin />
    </PageWrapper>
  );
}
