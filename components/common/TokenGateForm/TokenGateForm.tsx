import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import PrimaryButton from 'components/common/PrimaryButton';
import { WalletSign } from 'components/login';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import type { TokenGateEvaluationResult, TokenGateWithRoles, TokenGateJoinType } from 'lib/token-gates/interfaces';

import type { AuthSig } from '../../../lib/blockchain/interfaces';

import TokenGateOption from './TokenGateOption';

interface Props {
  onSuccess: (values: Space) => void;
  spaceDomain: string;
  joinButtonLabel?: string;
  joinType?: TokenGateJoinType;
}

export default function TokenGateForm ({ onSuccess, spaceDomain, joinButtonLabel, joinType = 'token_gate' }: Props) {

  const { showMessage } = useSnackbar();
  const { spaces, setSpaces } = useSpaces();
  const { user, loginFromWeb3Account, refreshUserWithWeb3Account } = useUser();

  const [tokenGates, setTokenGates] = useState<TokenGateWithRoles[] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [verifyingGates, setIsVerifyingGates] = useState(false);
  const [joiningSpace, setJoiningSpace] = useState(false);

  const [tokenGateResult, setTokenGateResult] = useState<TokenGateEvaluationResult | null>(null);
  // Token gates with those that succeedeed first

  useEffect(() => {
    if (!spaceDomain || spaceDomain.length < 3) {
      setTokenGates(null);
      setTokenGateResult(null);
      setIsLoading(false);
    }
    else {
      setIsLoading(true);
      charmClient.getTokenGatesForSpace({ spaceDomain })
        .then(gates => {
          setTokenGates(gates);
          setIsLoading(false);
        })
        .catch(() => {
          setTokenGates(null);
          setIsLoading(false);
        });
    }
  }, [spaceDomain]);

  async function evaluateEligibility (authSig: AuthSig) {
    // Reset the current state
    setTokenGateResult(null);
    setIsVerifyingGates(true);

    if (!user) {
      await loginFromWeb3Account();
    }

    try {
      const verifyResult = await charmClient.evalueTokenGateEligibility({
        authSig,
        spaceIdOrDomain: spaceDomain
      });
      setTokenGateResult(verifyResult);
      if (verifyResult.canJoinSpace) {
        showMessage('Verification succeeded.', 'success');
      }

      setIsVerifyingGates(false);
    }
    catch (err) {
      setIsVerifyingGates(false);
    }
  }

  async function onSubmit () {
    setJoiningSpace(true);

    try {
      await charmClient.verifyTokenGate({
        commit: true,
        spaceId: tokenGateResult?.space.id as string,
        tokens: tokenGateResult?.gateTokens.map(tk => {
          return {
            signedToken: tk.signedToken,
            tokenGateId: tk.tokenGate.id
          };
        }) ?? [],
        joinType
      });

      showMessage(`You have joined the ${tokenGateResult?.space.name} workspace.`, 'success');

      await refreshUserWithWeb3Account();

      const spaceExists = spaces.some(s => s.id === tokenGateResult?.space.id);

      // Refresh spaces as otherwise the redirect will not work
      if (!spaceExists) {
        setSpaces([...spaces, tokenGateResult?.space as Space]);
      }
      onSuccess(tokenGateResult?.space as Space);
    }
    catch (err: any) {
      showMessage(err?.message ?? (err ?? 'An unknown error occurred'), 'error');
    }

    setJoiningSpace(false);

  }

  if (isLoading) {
    return <LoadingComponent height='80px' isLoading={true} />;
  }

  if (!isLoading && (!tokenGates || tokenGates?.length === 0)) {
    return (
      <Alert data-test='token-gate-empty-state' severity='info' sx={{ my: 1 }}>
        No token gates found for this workspace.
      </Alert>
    );
  }

  return (
    <Grid container direction='column' spacing={2} sx={{ mt: 2 }} data-test='token-gate-form'>
      <Grid item>
        <Typography variant='body2'>
          Verify your wallet to check if you can join this workspace and which roles you can receive.
        </Typography>
      </Grid>

      {
        tokenGates?.map((gate, index, list) => (
          <Grid item xs key={gate.id}>
            <TokenGateOption
              tokenGate={gate}
              isVerifying={verifyingGates}
              validGate={tokenGateResult ? (tokenGateResult.gateTokens.some(g => g.tokenGate.id === gate.id)) : null}
            />
            {
              index < list.length - 1 && (
                <Typography color='secondary' sx={{ mb: -1, mt: 2, textAlign: 'center' }}>OR</Typography>
              )
            }
          </Grid>
        ))
      }

      {
        tokenGateResult && (
          <Grid item xs>
            {
              !tokenGateResult.canJoinSpace ? (
                <Alert severity='warning' data-test='token-gate-failure-alert'>
                  Your wallet does not meet any of the conditions to access this space. You can try with another wallet.
                </Alert>
              ) : (
                <Alert severity='success'>
                  You can join this workspace. {tokenGateResult.roles.length > 0 ? 'You will also receive the roles attached to each condition you passed' : ''}
                </Alert>
              )
            }
          </Grid>
        )
      }

      <Grid item>
        {
          !tokenGateResult?.canJoinSpace ? (
            <WalletSign signSuccess={evaluateEligibility} buttonStyle={{ width: '100%' }} />
          ) : (
            <PrimaryButton
              size='large'
              fullWidth
              type='submit'
              loading={joiningSpace}
              disabled={joiningSpace}
              onClick={onSubmit}
            >
              {joinButtonLabel || 'Join workspace'}
            </PrimaryButton>
          )
        }

      </Grid>
      <Grid item>
        <Typography component='p' variant='caption' align='center'>
          Powered by
          {' '}
          <Link href='https://litprotocol.com/' external target='_blank'>Lit Protocol</Link>
        </Typography>
      </Grid>

    </Grid>
  );
}

