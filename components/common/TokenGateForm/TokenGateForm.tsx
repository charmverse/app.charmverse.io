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
      <>
        <PrimaryButton size='large' fullWidth type='submit' onClick={generateAuthSignature}>
          Verify wallet
        </PrimaryButton>
        {
        tokenGateResult && !tokenGateResult.canJoinSpace && (
          <Alert sx={{ mt: 2 }} severity='warning'>
            Your wallet does not meet any of the conditions to access this space. You can try with another wallet.
          </Alert>
        )
      }
      </>

    );
  }

  if (tokenGateResult?.canJoinSpace) {
    return (
      <Grid container direction='column' spacing={2} sx={{ mt: 2 }}>
        <Grid item>
          <Alert severity='success'>
            {
            tokenGateResult.roles.length > 0 ? (
              <>

                You can join this space and receive these roles:
                <Box sx={{ mt: 1 }}>
                  {tokenGateResult.roles.map(role => <Chip sx={{ mr: 2 }} key={role.id} label={role.name} />)}
                </Box>
              </>
            ) : (
              'You can join this space.'
            )
          }
          </Alert>
        </Grid>
        <Grid item>
          <PrimaryButton
            size='large'
            fullWidth
            type='submit'
            onClick={() => {
              router.push(`/${tokenGateResult.space.domain}`);
            }}
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
      </Grid>
    );
  }

  // This should never happen, but just in case
  return null;

}
