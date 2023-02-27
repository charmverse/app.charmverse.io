import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

import PrimaryButton from 'components/common/PrimaryButton';
import type { SpaceWithGates } from 'lib/spaces/interfaces';

import { GateOption } from '../GateOption';

import { useSummonGate } from './hooks/useSummonGate';

type Props = {
  space: SpaceWithGates;
  onSuccess: () => void;
};

export function SummonGate({ space, onSuccess }: Props) {
  const { isSummonEnabled, isVerified, isLoading, joinSpace, joiningSpace } = useSummonGate({
    space,
    onSuccess
  });

  if (!isSummonEnabled) {
    return null;
  }

  return (
    <Stack>
      <GateOption description='Belongs to Summon community' isVerifying={isLoading} isVerified={!!isVerified} />

      {isVerified && (
        <PrimaryButton disabled={joiningSpace} onClick={joinSpace} loading={joiningSpace}>
          Join Space
        </PrimaryButton>
      )}
    </Stack>
  );
}
