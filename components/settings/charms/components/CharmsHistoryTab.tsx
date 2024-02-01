import { Divider, Stack, Typography } from '@mui/material';

import { useSpacesCharmsState, useTransferCharms } from 'charmClient/hooks/charms';
import LoadingComponent from 'components/common/LoadingComponent';
import { ApplySpaceItem } from 'components/settings/charms/components/ApplySpaceItem';
import { useUser } from 'hooks/useUser';
import type { CharmsBalance } from 'lib/charms/getUserOrSpaceWallet';
import type { TransferCharmsInput } from 'lib/charms/transferCharms';

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
