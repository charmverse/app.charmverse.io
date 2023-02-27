import { Alert, Grid, Typography } from '@mui/material';
import type { AuthSig } from 'lit-js-sdk';

import Link from 'components/common/Link';
import PrimaryButton from 'components/common/PrimaryButton';
import { WalletSign } from 'components/login';
import type { TokenGateEvaluationResult, TokenGateWithRoles } from 'lib/token-gates/interfaces';

import { TokenGateOption } from './TokenGateOption';

type Props = {
  tokenGates: TokenGateWithRoles[] | null;
  tokenGateResult: TokenGateEvaluationResult | null;
  verifyingGates: boolean;
  evaluateEligibility: (sig: AuthSig) => void;
  joinSpace: () => void;
  joiningSpace: boolean;
};

export function TokenGateContent({
  tokenGates,
  tokenGateResult,
  verifyingGates,
  evaluateEligibility,
  joinSpace,
  joiningSpace
}: Props) {
  return (
    <Grid container direction='column' spacing={2} data-test='token-gate-form'>
      {tokenGates?.map((gate, index, list) => (
        <Grid item xs key={gate.id}>
          <TokenGateOption
            tokenGate={gate}
            isVerifying={verifyingGates}
            isVerified={tokenGateResult ? tokenGateResult.gateTokens.some((g) => g.tokenGate.id === gate.id) : null}
          />
          {index < list.length - 1 && (
            <Typography color='secondary' sx={{ mb: -1, mt: 2, textAlign: 'center' }}>
              OR
            </Typography>
          )}
        </Grid>
      ))}

      <Grid item>
        {!tokenGateResult?.canJoinSpace ? (
          <WalletSign loading={verifyingGates} signSuccess={evaluateEligibility} buttonStyle={{ width: '100%' }} />
        ) : (
          <PrimaryButton
            size='large'
            fullWidth
            type='submit'
            loading={joiningSpace}
            disabled={joiningSpace}
            onClick={joinSpace}
          >
            Join space
          </PrimaryButton>
        )}
      </Grid>
      <Grid item>
        <Typography component='p' variant='caption' align='center'>
          Powered by{' '}
          <Link href='https://litprotocol.com/' external target='_blank'>
            Lit Protocol
          </Link>
        </Typography>
      </Grid>

      {tokenGateResult && (
        <Grid item xs>
          {!tokenGateResult.canJoinSpace ? (
            <Alert severity='warning' data-test='token-gate-failure-alert'>
              Your wallet does not meet any of the conditions to access this space. You can try with another wallet.
            </Alert>
          ) : (
            <Alert severity='success'>
              You can join this space.{' '}
              {tokenGateResult.roles.length > 0
                ? 'You will also receive the roles attached to each condition you passed.'
                : ''}
            </Alert>
          )}
        </Grid>
      )}
    </Grid>
  );
}
