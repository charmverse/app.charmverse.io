import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
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
import { TokenGateVerificationResult, TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { checkAndSignAuthMessage } from 'lit-js-sdk';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import TokenGateOption from './TokenGateOption';

interface Props {
  onSuccess: (values: Space) => void;
  spaceDomain: string;
  joinButtonLabel?: string;
}

export default function TokenGateForm ({ onSuccess, spaceDomain, joinButtonLabel }: Props) {

  const router = useRouter();
  const { account, chainId } = useWeb3React();
  const { showMessage } = useSnackbar();
  const [error, setError] = useState('');
  const [tokenGates, setTokenGates] = useState<TokenGateWithRoles[] | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  const [tokenGateResult, setTokenGateResult] = useState<TokenGateVerificationResult | null>(null);
  // Token gates with those that succeedeed first
  const sortedTokenGates = tokenGates?.sort((a, b) => {

    const aVerified = tokenGateResult?.gateTokens.some(g => g.tokenGate.id === a.id);
    const bVerified = tokenGateResult?.gateTokens.some(g => g.tokenGate.id === b.id);

    if (aVerified && !bVerified) {
      return -1;
    }
    else if (!aVerified && bVerified) {
      return 1;
    }
    else {
      return 0;
    }
  }) ?? [];

  useEffect(() => {
    if (!spaceDomain || spaceDomain.length < 3) {
      setTokenGates(null);
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

    setError('');

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

  if (!tokenGateResult || !tokenGateResult.canJoinSpace) {
    return (
      <Grid container direction='column' spacing={2} sx={{ mt: 2 }}>

        <Grid item>
          <Typography variant='body2'>
            Verify your wallet to check if you can join this workspace and which roles you can receive.
          </Typography>
        </Grid>

        <Grid item xs>
          <PrimaryButton size='large' fullWidth type='submit' onClick={generateAuthSignature}>
            Verify wallet
          </PrimaryButton>
        </Grid>
        <Grid item>
          <Typography component='p' variant='caption' align='center'>
            Powered by
            {' '}
            <Link href='https://litprotocol.com/' external target='_blank'>Lit Protocol</Link>
          </Typography>
        </Grid>

        {
        tokenGateResult && !tokenGateResult.canJoinSpace && (
        <Grid item xs>
          <Alert sx={{ mt: 2 }} severity='warning'>
            Your wallet does not meet any of the conditions to access this space. You can try with another wallet.
          </Alert>
        </Grid>
        )
}

        {
          tokenGates?.map(gate => (
            <Grid item xs key={gate.id}>
              <TokenGateOption
                tokenGate={gate}
              />
            </Grid>
          ))
        }

      </Grid>

    );
  }

  if (tokenGateResult?.canJoinSpace) {
    return (
      <Grid container direction='column' spacing={2} sx={{ mt: 2 }}>
        <Grid item>
          <Alert severity='success'>
            You can join this workspace. {tokenGateResult.roles.length > 0 ? 'You will also receive the roles attached to each condition you passed' : ''}
          </Alert>
        </Grid>

        <Grid item>
          <PrimaryButton
            size='large'
            fullWidth
            type='submit'
            disabled={!tokenGateResult?.canJoinSpace}
            onClick={onSubmit}
          >
            {joinButtonLabel || 'Join workspace'}
          </PrimaryButton>
        </Grid>
        <Grid item>
          <Typography component='p' variant='caption' align='center'>
            Powered by
            {' '}
            <Link href='https://litprotocol.com/' external target='_blank'>Lit Protocol</Link>
          </Typography>
        </Grid>

        {
          sortedTokenGates.map(gate => (
            <Grid item xs key={gate.id}>
              <TokenGateOption
                tokenGate={gate}
                isSelected={tokenGateResult?.gateTokens.some(g => g.tokenGate.id === gate.id)}
              />
            </Grid>
          ))
        }

      </Grid>
    );
  }

  // This should never happen, but just in case
  return null;

}
