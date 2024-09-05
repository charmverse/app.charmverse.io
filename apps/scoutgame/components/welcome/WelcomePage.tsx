import type { Scout } from '@charmverse/core/prisma-client';
import { FarcasterCard } from '@connect-shared/components/common/FarcasterCard';
import { PageWrapper } from '@connect-shared/components/common/PageWrapper';
import Box from '@mui/material/Box';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: Scout }) {
  return (
    <PageWrapper>
      <Box display='flex' gap={2} flexDirection='column'>
        {user.farcasterId && (
          <FarcasterCard
            name={user.username ?? undefined}
            avatar={user.avatar ?? undefined}
            username={user.username ?? undefined}
            fid={Number(user.farcasterId)}
          />
        )}
        <br />
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}
