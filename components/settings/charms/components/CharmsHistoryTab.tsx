import { Stack, Typography } from '@mui/material';

import { useUser } from 'hooks/useUser';
import type { CharmsBalance } from 'lib/charms/getUserOrSpaceBalance';

type Props = {
  charmWallet?: CharmsBalance | null;
};

export function CharmsHistoryTab({ charmWallet }: Props) {
  const { user } = useUser();

  return (
    <Stack gap={2} justifyContent='center' alignItems='center' my={2}>
      <Typography color='secondary'>Your Charms transaction history</Typography>
    </Stack>
  );
}
