import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { useWeb3Account } from 'hooks/useWeb3Account';
import { humanizeConditionsData } from '@packages/lib/tokenGates/humanizeConditions';
import type { TokenGateWithRoles } from '@packages/lib/tokenGates/interfaces';

import { GateOption } from '../GateOption';

import { ConditionsGroup } from './TokenGateConditions';

interface Props {
  tokenGate: TokenGateWithRoles;
  isVerified: boolean | null;
  isVerifying: boolean;
}

export function TokenGateOption({ tokenGate, isVerified, isVerifying }: Props) {
  const conditions = humanizeConditionsData(tokenGate.conditions);

  return (
    <GateOption isVerified={isVerified} isVerifying={isVerifying}>
      <ConditionsGroup conditions={conditions} operator={tokenGate.conditions.operator} />
      {tokenGate.tokenGateToRoles.length > 0 && (
        <Box mt={1}>
          <Typography sx={{ mr: 1 }} variant='caption'>
            Roles
          </Typography>
          {tokenGate.tokenGateToRoles.map(({ role }) => (
            <Chip
              variant='outlined'
              size='small'
              sx={{ mr: 2, fontWeight: isVerified ? 'bold' : undefined }}
              color={isVerified ? 'success' : 'secondary'}
              key={role.id}
              label={role.name}
            />
          ))}
        </Box>
      )}
    </GateOption>
  );
}
