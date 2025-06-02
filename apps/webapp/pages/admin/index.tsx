import { log } from '@charmverse/core/log';
import { Box, Typography } from '@mui/material';
import { isProdEnv } from '@packages/config/constants';
import { withSessionSsr } from '@packages/lib/session/withSession';
import type { GetServerSideProps } from 'next';

import { AdminSpacesTable } from 'components/admin/components/AdminSpacesTable';
import { getLayout } from 'components/common/BaseLayout/getLayout';
import { whitelist } from 'lib/admin/users';

export const getServerSideProps: GetServerSideProps = withSessionSsr(async (context) => {
  const sessionUserId = context.req.session?.user?.id;

  if (isProdEnv && !whitelist.includes(sessionUserId)) {
    log.warn('User attempted to access admin page', { userId: sessionUserId });
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    };
  }
  log.info('User accessed admin page', { userId: sessionUserId });

  return {
    props: {}
  };
});

export default function AdminPage() {
  return getLayout(
    <Box p={3}>
      <Typography variant='h1' sx={{ mb: 3 }}>
        Admin
      </Typography>
      <AdminSpacesTable />
    </Box>
  );
}
