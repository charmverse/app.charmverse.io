import { Divider, Stack, Typography } from '@mui/material';

import { useSpacesCharmsState, useTransferCharms } from 'charmClient/hooks/charms';
import LoadingComponent from 'components/common/LoadingComponent';
import { ApplySpaceItem } from 'components/settings/charms/components/ApplySpaceItem';
import { useUser } from 'hooks/useUser';
import type { CharmsBalance } from '@packages/lib/charms/getUserOrSpaceBalance';
import type { TransferCharmsInput } from '@packages/lib/charms/transferCharms';

type Props = {
  charmWallet?: CharmsBalance | null;
  onRefresh: () => void;
};

export function ApplyCharmsTab({ charmWallet, onRefresh }: Props) {
  const { user } = useUser();
  const { data: spacesState, mutate: refreshSpacesState } = useSpacesCharmsState(user?.id);
  const { trigger: applyCharms } = useTransferCharms();

  const onApplyCharms = async (params: TransferCharmsInput) => {
    await applyCharms(params);
    onRefresh();
    refreshSpacesState();
  };

  if (!spacesState) return <LoadingComponent isLoading />;

  return (
    <Stack gap={2}>
      <Typography variant='subtitle1'>Apply charms to space</Typography>

      {spacesState.map((s, i) => (
        <>
          {i > 0 && <Divider />}
          <ApplySpaceItem
            key={s.spaceId}
            spaceStatus={s}
            userBalance={charmWallet?.balance || 0}
            onApplyCharms={onApplyCharms}
          />
        </>
      ))}
    </Stack>
  );
}
