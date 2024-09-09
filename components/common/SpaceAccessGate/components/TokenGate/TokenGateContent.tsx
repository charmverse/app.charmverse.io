import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import type { TokenGateState } from './hooks/useTokenGates';
import { TokenGateOption } from './TokenGateOption';

export type TokenGateContentProps = Pick<TokenGateState, 'tokenGates' | 'tokenGateResult' | 'isVerifying'>;

export function TokenGateContent({ tokenGates, tokenGateResult, isVerifying }: TokenGateContentProps) {
  return (
    <Box data-test='token-gate-form' display='flex' flexDirection='row' gap={2}>
      {tokenGates?.map((gate, index, list) => (
        <Box key={gate.id} width='100%'>
          <TokenGateOption
            tokenGate={gate}
            isVerifying={isVerifying}
            isVerified={tokenGateResult?.eligibleGates.some((tokenGateId) => tokenGateId === gate.id) ?? null}
          />
          {index < list.length - 1 && (
            <Typography color='secondary' align='center'>
              OR
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
