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
import { TokenGateWithRoles } from 'lib/token-gates/interfaces';
import { isTruthy } from 'lib/utilities/types';
import TokenGateOption from './TokenGateOption';

interface Props {
  onSubmit: (values: Space) => void;
}

export default function JoinSpacePage ({ onSubmit: _onSubmit }: Props) {

  const router = useRouter();
  const { account, chainId } = useWeb3React();
  const { showMessage } = useSnackbar();
  const [error, setError] = useState('');
  const [user, setUser] = useUser();
  const [, setSpaces] = useSpaces();
  const [tokenGates, setTokenGates] = useState<TokenGateWithRoles[] | null>(null);

  const [selectedTokenGate, setSelectedTokenGate] = useState<TokenGateWithRoles | null>(null);

  const [description, setDescription] = useState('');
  const [spaceDomain, setSpaceDomain] = useState('');
  const litClient = useLitProtocol();
  const [userInputStatus, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (router.query.domain) {
      setSpaceDomain(stripUrlParts(router.query.domain as string));
    }
  }, []);

  useEffect(() => {
    if (spaceDomain.length < 3) {
      setStatus('');
      setTokenGates(null);
    }
    else {
      charmClient.getTokenGatesForSpace({ spaceDomain })
        .then(gates => {
          setTokenGates(gates);
          if (gates[0]) {
            setStatus('Workspace found');
          }
          else {
            setStatus('Workspace not found');
          }

          if (selectedTokenGate && gates.every(g => g.id !== selectedTokenGate.id)) {
            setSelectedTokenGate(gates[0] ?? null);
          }

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

  function onChangeDomainName (event: ChangeEvent<HTMLInputElement>) {
    const domain = stripUrlParts(event.target.value);
    setSpaceDomain(domain);
  }

  function stripUrlParts (maybeUrl: string) {
    return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
  }

  return (
    <>
      <DialogTitle>Join a workspace</DialogTitle>
      <Divider />
      <br />
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <FieldLabel>Enter a CharmVerse Domain or URL</FieldLabel>
          <TextField
            onChange={onChangeDomainName}
            autoFocus
            placeholder='https://app.charmverse.io/my-space'
            fullWidth
            value={spaceDomain}
            helperText={userInputStatus}
            InputProps={{
              endAdornment: isTruthy(tokenGates?.[0]) && <CheckIcon color='success' />
            }}
          />
        </Grid>
        <Grid item>
          <Typography variant='h6' gutterBottom>
            {tokenGates?.[0]?.space?.name}
          </Typography>
          <Typography variant='body2'>
            Please verify that you meet the requirements to join
          </Typography>
        </Grid>
        {
          tokenGates?.map(gate => {
            return (
              <Grid item>
                <TokenGateOption tokenGate={gate} key={gate.id} select={setSelectedTokenGate} isSelected={selectedTokenGate?.id === gate.id} />
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
    </>
  );

}
