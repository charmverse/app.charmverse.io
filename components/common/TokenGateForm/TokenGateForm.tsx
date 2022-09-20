import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import getLitChainFromChainId from 'lib/token-gates/getLitChainFromChainId';
import type { TokenGateEvaluationResult, TokenGateWithRoles } from 'lib/token-gates/interfaces';
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
  const [spaces, setSpaces] = useSpaces();
  const { user, setUser } = useUser();

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

  async function generateAuthSignature () {
    // Reset the current state
    setTokenGateResult(null);
    setIsVerifyingGates(true);

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
        }) ?? []
      });

      showMessage(`You have joined the ${tokenGateResult?.space.name} workspace.`, 'success');
      const spaceExists = spaces.some(s => s.id === tokenGateResult?.space.id);

      // Refresh the user account. This was required as otherwise the user would not be able to see the first page upon joining the space
      const refreshedProfile = await charmClient.login(account as string);

      setUser(refreshedProfile);

      // Refresh spaces as otherwise the redirect will not work
      if (!spaceExists) {
        setSpaces([...spaces, tokenGateResult?.space as Space]);
      }
      onSuccess(tokenGateResult?.space as Space);
      // onSuccess(tokenGateResult?.space as Space);
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
            <PrimaryButton disabled={verifyingGates} size='large' fullWidth type='submit' onClick={generateAuthSignature}>
              Verify wallet
            </PrimaryButton>
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

