import type { Scout } from '@charmverse/core/prisma';
import { Button } from '@mui/material';
import Box from '@mui/material/Box';
import Link from 'next/link';

import { SinglePageLayout } from 'components/common/Layout';
import { SinglePageWrapper } from 'components/common/SinglePageWrapper';

export function BuilderWelcomePage({ user }: { user: Scout }) {
  return (
    <SinglePageLayout>
      <SinglePageWrapper>
        <Box display='flex' gap={2} flexDirection='column'>
          Are you a builder?
          <Button component={Link} href='/'>
            Skip for now
          </Button>
        </Box>
      </SinglePageWrapper>
    </SinglePageLayout>
  );
}
