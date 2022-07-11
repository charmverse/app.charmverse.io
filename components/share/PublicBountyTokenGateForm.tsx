import { humanizeAccessControlConditions, checkAndSignAuthMessage } from 'lit-js-sdk';
import { useState, useEffect, ChangeEvent } from 'react';
import { useWeb3React } from '@web3-react/core';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/common/form/FieldLabel';
import Divider from '@mui/material/Divider';
import CheckIcon from '@mui/icons-material/Check';
import { TokenGate, Space } from '@prisma/client';
import Link from 'components/common/Link';
import { DialogTitle, ErrorModal } from 'components/common/Modal';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import charmClient from 'charmClient';
import { useRouter } from 'next/router';
import log from 'lib/log';
import { useSnackbar } from 'hooks/useSnackbar';
import getLitChainFromChainId from 'lib/token-gates/getLitChainFromChainId';
import LoadingComponent from 'components/common/LoadingComponent';

interface Props {
  onSubmit: (values: Space) => void;
  spaceDomainToAccess: string
}

export default function JoinSpacePage ({ onSubmit: _onSubmit, spaceDomainToAccess }: Props) {

  const router = useRouter();
  const { account, chainId } = useWeb3React();
  const { showMessage } = useSnackbar();
  const [error, setError] = useState('');
  const [user, setUser] = useUser();
  const [spaces, setSpaces] = useSpaces();
  const [tokenGate, setTokenGate] = useState<TokenGate & { space: Space } | null>(null);
  const [description, setDescription] = useState('');
  const [spaceDomain, setSpaceDomain] = useState(spaceDomainToAccess);
  const litClient = useLitProtocol();
  const [userInputStatus, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // We will use this only when providing the space domain externally, so as not to show an empty form
  const [loadingTokenGates, setLoadingTokenGates] = useState(!!spaceDomainToAccess);

  useEffect(() => {
    if (!tokenGate) {
      setDescription('');
    }
    else {
      humanizeAccessControlConditions({
        ...tokenGate.conditions as any,
        myWalletAddress: account || ''
      }).then(result => {
        setDescription(result);
      });
    }
  }, [tokenGate]);

  useEffect(() => {
    if (spaceDomain.length < 3) {
      setStatus('');
      setTokenGate(null);
    }
    else {
      setLoadingTokenGates(true);
      charmClient.getTokenGatesForSpace({ spaceDomain })
        .then(gates => {
          const firstGate = gates[0];
          if (firstGate) {
            setTokenGate(firstGate);
          }
          else {
            setStatus('This workspace is invite-only. Please contact the admin.');

          }
          setLoadingTokenGates(false);
        });
    }
  }, [spaceDomain]);

  async function onSubmit () {
    if (!tokenGate || !litClient) {
      return;
    }

    setIsLoading(true);

    const chain = getLitChainFromChainId(chainId);

    setError('');

    const authSig = await checkAndSignAuthMessage({ chain })
      .catch(err => {
        if (err.errorCode === 'unsupported_chain') {
          setError('Unsupported Network. Please make sure you are connected to the correct network');
        }
        else {
          log.error(`error getting signature: ${err.message || err}`);
        }
      });

    const jwt = authSig && await litClient.getSignedToken({
      authSig,
      chain: (tokenGate.conditions as any).chain || 'ethereum',
      resourceId: tokenGate.resourceId as any,
      ...tokenGate.conditions as any
    })
      .catch(err => {
        if (err.errorCode === 'not_authorized') {
          setError('Please make sure your wallet meets the requirements');
        }
        else {
          setError(err.message || err);
        }
        return null;
      });

    // create user if we need one
    if (!user && account) {
      try {
        const userProfile = await charmClient.login(account);
        setUser(userProfile);
      }
      catch (err) {
        const userProfile = await charmClient.createUser({ address: account });
        setUser(userProfile);
      }
    }

    const result = jwt ? await charmClient.unlockTokenGate({ jwt, id: tokenGate.id }) : null;
    if (result?.space) {

      // refresh user permissions
      const _user = await charmClient.getUser();
      setUser(_user);
      charmClient.getSpaces()
        .then(_spaces => {
          setSpaces(_spaces);
          showMessage(`Successfully joined workspace: ${result.space.name}`);
          _onSubmit(result.space);
        });
    }
    else if (result?.error) {
      setError(result.error);
    }
    else {
      log.error('Unhandled response from token gate', result);
    }
    setIsLoading(false);
  }

  return (

    <Grid container direction='column' spacing={2}>

      {
          loadingTokenGates && (
            <LoadingComponent height='200px' isLoading={true} />
          )
        }

      { // Added to show the error state when we provide the domain externally, and no token gates exist
         userInputStatus && !tokenGate && !loadingTokenGates && (
         <Typography sx={{ ml: 2, mt: 1 }}>
           {userInputStatus}
         </Typography>
         )
        }

      {description && tokenGate && !loadingTokenGates && (
      <>
        <Grid item>
          <Typography variant='h6' gutterBottom>
            {tokenGate?.space?.name}
          </Typography>
          <Typography variant='body2'>
            Please verify that you meet the requirements to join
          </Typography>
          <Card variant='outlined' sx={{ my: 2 }}>
            <CardContent>
              <Typography gutterBottom>
                {description}
              </Typography>
              {/* <Typography variant='body2'>
                    Chain:
                    {' '}
                    {tokenGate && getChainName(tokenGate)}
                  </Typography> */}
            </CardContent>
          </Card>
        </Grid>
        <Grid item>
          <PrimaryButton loading={isLoading} size='large' fullWidth type='submit' onClick={onSubmit}>
            Verify Wallet
          </PrimaryButton>
        </Grid>
        <Grid item>
          <Typography component='p' variant='caption' align='center'>
            Powered by
            {' '}
            <Link href='https://litprotocol.com/' external target='_blank'>Lit Protocol</Link>
          </Typography>
        </Grid>
      </>
      )}
      <ErrorModal
        title='Access denied'
        message={error}
        open={!!error}
        onClose={() => setError('')}
      />
    </Grid>
  );

}
