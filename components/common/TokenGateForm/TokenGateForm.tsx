import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { Space } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import charmClient from 'charmClient';
import Link from 'components/common/Link';
import LoadingComponent from 'components/common/LoadingComponent';
import { ErrorModal } from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import log from 'lib/log';
import getLitChainFromChainId from 'lib/token-gates/getLitChainFromChainId';
import { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { checkAndSignAuthMessage } from 'lit-js-sdk';
import { useEffect, useState } from 'react';
import TokenGateOption from './TokenGateOption';

interface Props {
  onSubmit: (values: Space) => void;
  spaceDomain: string
}

export default function TokenGateForm ({ onSubmit: _onSubmit, spaceDomain }: Props) {

  const { account, chainId } = useWeb3React();
  const { showMessage } = useSnackbar();
  const [error, setError] = useState('');
  const [user, setUser] = useUser();
  const [, setSpaces] = useSpaces();
  const [tokenGates, setTokenGates] = useState<TokenGateWithRoles[] | null>(null);

  const [selectedTokenGate, setSelectedTokenGate] = useState<TokenGateWithRoles | null>(null);

  const litClient = useLitProtocol();

  const [isLoading, setIsLoading] = useState(true);

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
          if (gates[0]) {
            setSelectedTokenGate(gates[0]);
          }
          else {
            setSelectedTokenGate(null);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setTokenGates(null);
          setIsLoading(false);
        });
    }
  }, [spaceDomain]);

  async function onSubmit () {
    if (!tokenGates || !litClient || !selectedTokenGate) {
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
      chain: (selectedTokenGate.conditions as any).chain || 'ethereum',
      resourceId: selectedTokenGate.resourceId as any,
      ...selectedTokenGate.conditions as any
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
    const result = jwt ? await charmClient.unlockTokenGate({ jwt, id: selectedTokenGate.id }) : null;
    if (result?.space) {
      // create user if we need one
      if (!user && account) {
        await charmClient.createUser({ address: account });
      }
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

  if (isLoading) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  if (!isLoading && (!tokenGates || tokenGates?.length === 0)) {
    return (
      <Alert severity='info' sx={{ my: 1 }}>
        No token gates found for this workspace.
      </Alert>
    );
  }

  return (
    <Grid container direction='column' spacing={2} sx={{ my: 2 }}>
      <Grid item>
        <Typography variant='body2'>
          {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          tokenGates!.length > 1 ? 'To join, please select the condition you want to verify.' : 'Please verify that you meet the requirements to join.'
        }
        </Typography>
      </Grid>
      {
          tokenGates?.map((gate, index, list) => {
            return (
              <Grid item>
                <TokenGateOption tokenGate={gate} key={gate.id} onSelect={setSelectedTokenGate} isSelected={selectedTokenGate?.id === gate.id} />

                {
                  // Don't show or after the last list item
                  index < list.length - 1 && (
                    <Typography color='secondary' sx={{ mb: -1, mt: 2, textAlign: 'center' }}>
                      OR
                    </Typography>
                  )
                }

              </Grid>
            );
          })
        }

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
      <ErrorModal
        title='Access denied'
        message={error}
        open={!!error}
        onClose={() => setError('')}
      />
    </Grid>
  );

}
