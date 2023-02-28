import { Box, Typography } from '@mui/material';

import Link from 'components/common/Link';

import type { TokenGateState } from './hooks/useTokenGates';
import { TokenGateOption } from './TokenGateOption';

export function TokenGateContent({ tokenGates, tokenGateResult, isVerifying }: TokenGateState) {
  return (
    <div data-test='token-gate-form'>
      {tokenGates?.map((gate, index, list) => (
        <Box mb={2} key={gate.id}>
          <TokenGateOption
            tokenGate={gate}
            isVerifying={isVerifying}
            isVerified={tokenGateResult ? tokenGateResult.gateTokens.some((g) => g.tokenGate.id === gate.id) : null}
          />
          {index < list.length - 1 && (
            <Typography color='secondary' align='center'>
              OR
            </Typography>
          )}
        </Box>
      ))}
      <Box mb={2}>
        <Typography component='p' variant='caption' align='center'>
          Token Gates powered by{' '}
          <Link href='https://litprotocol.com/' external target='_blank'>
            Lit Protocol
          </Link>
        </Typography>
      </Box>
    </div>
  );
}
