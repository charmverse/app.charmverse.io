import { Alert, Grid, Typography } from '@mui/material';
import type { AuthSig } from 'lit-js-sdk';

import Link from 'components/common/Link';
import PrimaryButton from 'components/common/PrimaryButton';
import TokenGateOption from 'components/common/TokenGateForm/TokenGateOption';
import { WalletSign } from 'components/login';
import type { TokenGateEvaluationResult, TokenGateWithRoles } from 'lib/token-gates/interfaces';

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
      <Grid item>
        <Typography variant='body2'>
          Verify your wallet to check if you can join this workspace and which roles you can receive.
        </Typography>
      </Grid>

      {tokenGates?.map((gate, index, list) => (
        <Grid item xs key={gate.id}>
          <TokenGateOption
            tokenGate={gate}
            isVerifying={verifyingGates}
            validGate={tokenGateResult ? tokenGateResult.gateTokens.some((g) => g.tokenGate.id === gate.id) : null}
          />
          {index < list.length - 1 && (
            <Typography color='secondary' sx={{ mb: -1, mt: 2, textAlign: 'center' }}>
              OR
            </Typography>
          )}
        </Grid>
      ))}

      {tokenGateResult && (
        <Grid item xs>
          {!tokenGateResult.canJoinSpace ? (
            <Alert severity='warning' data-test='token-gate-failure-alert'>
              Your wallet does not meet any of the conditions to access this space. You can try with another wallet.
            </Alert>
          ) : (
            <Alert severity='success'>
              You can join this workspace.{' '}
              {tokenGateResult.roles.length > 0
                ? 'You will also receive the roles attached to each condition you passed'
                : ''}
            </Alert>
          )}
        </Grid>
      )}

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
            Join workspace
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
    </Grid>
  );
}
