import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { humanizeAccessControlConditions } from 'lit-js-sdk';
import { useEffect, useState } from 'react';

import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { TokenGateWithRoles } from 'lib/token-gates/interfaces';

import { GateOption } from '../GateOption';

interface Props {
  tokenGate: TokenGateWithRoles;
  isVerified: boolean | null;
  isVerifying: boolean;
}

export function TokenGateOption({ tokenGate, isVerified, isVerifying }: Props) {
  const { account } = useWeb3AuthSig();
  const [description, setDescription] = useState<string>('');

  useEffect(() => {
    humanizeAccessControlConditions({
      ...(tokenGate.conditions as any),
      myWalletAddress: account || ''
    }).then((result) => {
      setDescription(result);
    });
  }, [tokenGate]);

  return (
    <GateOption description={description} isVerified={isVerified} isVerifying={isVerifying}>
      {tokenGate.tokenGateToRoles.length > 0 && (
        <Grid item xs spacing={1}>
          <Typography sx={{ mr: 1 }} variant='caption'>
            Roles
          </Typography>
          {tokenGate.tokenGateToRoles.map((role) => (
            <Chip
              variant='outlined'
              size='small'
              sx={{ mr: 2, fontWeight: isVerified ? 'bold' : undefined }}
              color={isVerified ? 'success' : 'secondary'}
              key={role.id}
              label={role.role.name}
            />
          ))}
        </Grid>
      )}
    </GateOption>
  );
}
