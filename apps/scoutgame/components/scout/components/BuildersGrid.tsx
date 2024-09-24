'use client';

import { Box } from '@mui/material';

import { UserCardGrid } from 'components/common/Card/UserCardGrid';
import { useMdScreen } from 'hooks/useMediaScreens';
import type { BuilderUserInfo } from 'lib/builders/interfaces';

export function BuildersGrid({ users }: { users: BuilderUserInfo[] }) {
  const isDesktop = useMdScreen();
  return (
    <Box width='95svw' py={2} px={isDesktop ? 4 : 0} position='relative' mx='auto'>
      <UserCardGrid users={users} />
    </Box>
  );
}
