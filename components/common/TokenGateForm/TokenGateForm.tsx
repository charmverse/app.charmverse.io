import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Space } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import getLitChainFromChainId from 'lib/token-gates/getLitChainFromChainId';
import { TokenGateEvaluationResult, TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { checkAndSignAuthMessage } from 'lit-js-sdk';
import { useEffect, useState } from 'react';
import TokenGateOption from './TokenGateOption';

interface Props {
  onSuccess: (values: Space) => void;
  spaceDomain: string;
  joinButtonLabel?: string;
}

export default function TokenGateForm ({ onSuccess, spaceDomain, joinButtonLabel }: Props) {

  const { account, chainId } = useWeb3React();
  const { showMessage } = useSnackbar();

  const [tokenGates, setTokenGates] = useState<TokenGateWithRoles[] | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [verifyingGates, setIsVerifyingGates] = useState(false);

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

  async function generateAuthSignature () {
    // Reset the current state
    setTokenGateResult(null);
    window.localStorage.removeItem('lit-auth-signature');

    setIsLoading(true);

    const chain = getLitChainFromChainId(chainId);

    try {
      const authSig = await checkAndSignAuthMessage({ chain });
      const verifyResult = await charmClient.evalueTokenGateEligibility({
        authSig,
        spaceIdOrDomain: spaceDomain
      });
      setTokenGateResult(verifyResult);
      if (verifyResult.canJoinSpace) {
        showMessage('Verification succeeded.', 'success');
      }
      setIsLoading(false);
    }
    catch (err) {
      setIsLoading(false);
    }
  }

  async function onSubmit () {
    setIsLoading(true);
    try {
      const verified = await charmClient.verifyTokenGate({
        spaceId: tokenGateResult?.space.id as string,
        tokens: tokenGateResult?.gateTokens ?? []
      });

      showMessage(`You have joined the ${tokenGateResult?.space.name} workspace.`, 'success');

      onSuccess(tokenGateResult?.space as Space);
    }
    catch (err: any) {
      showMessage(err?.message ?? (err ?? 'An unknown error occurred'), 'error');
      setIsLoading(false);
    }

  }

  if (isLoading) {
    return <LoadingComponent height='80px' isLoading={true} />;
  }

  if (!isLoading && (!tokenGates || tokenGates?.length === 0)) {
    return (
      <Alert severity='info' sx={{ my: 1 }}>
        No token gates found for this workspace.
      </Alert>
    );
  }

  return (
    <Grid container direction='column' spacing={2} sx={{ mt: 2 }}>
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
                isVerifying={false}
                validGate={Math.random() > 0.5}
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
              <Alert sx={{ mt: 2 }} severity='warning'>
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
            <PrimaryButton size='large' fullWidth type='submit' onClick={generateAuthSignature}>
              Verify wallet
            </PrimaryButton>
          ) : (
            <PrimaryButton
              size='large'
              fullWidth
              type='submit'
              disabled={!tokenGateResult?.canJoinSpace}
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

