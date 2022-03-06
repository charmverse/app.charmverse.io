import { ALL_LIT_CHAINS, humanizeAccessControlConditions, Chain, checkAndSignAuthMessage } from 'lit-js-sdk';
import { useState, useEffect, ChangeEvent } from 'react';
import { useWeb3React } from '@web3-react/core';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Divider from '@mui/material/Divider';
import CheckIcon from '@mui/icons-material/Check';
import { TokenGate, Space } from '@prisma/client';
import { DialogTitle } from 'components/common/Modal';
import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import charmClient from 'charmClient';
import { useRouter } from 'next/router';

interface Props {
  onSubmit: (values: Space) => void;
}

export default function WorkspaceSettings ({ onSubmit: _onSubmit }: Props) {

  const router = useRouter();
  const { account } = useWeb3React();
  const [tokenGate, setTokenGate] = useState<TokenGate & { space: Space } | null>(null);
  const [description, setDescription] = useState('');
  const [spaceDomain, setSpaceDomain] = useState('');
  const litClient = useLitProtocol();
  const [userInputStatus, setStatus] = useState('');

  useEffect(() => {
    if (!tokenGate) {
      setDescription('');
    }
    else {
      humanizeAccessControlConditions({
        accessControlConditions: (tokenGate.conditions as any)?.accessControlConditions || [],
        myWalletAddress: account || ''
      }).then(result => {
        setDescription(result);
      });
    }
  }, [tokenGate]);

  useEffect(() => {
    if (router.query.domain) {
      setSpaceDomain(stripUrlParts(router.query.domain as string));
    }
  }, []);

  useEffect(() => {
    if (spaceDomain.length < 3) {
      setStatus('');
      setTokenGate(null);
    }
    else {
      charmClient.getTokenGatesForSpace({ spaceDomain })
        .then(gates => {
          setTokenGate(gates[0]);
          if (gates[0]) {
            setStatus('Workspace found');
          }
          else {
            setStatus('Workspace not found');
          }
        });
    }
  }, [spaceDomain]);

  async function onSubmit () {
    if (!tokenGate || !litClient) {
      return;
    }
    const chain = getChain(tokenGate);
    const authSig = await checkAndSignAuthMessage({
      chain
    });
    const jwt = await litClient.getSignedToken({
      resourceId: tokenGate.resourceId as any,
      authSig,
      chain,
      accessControlConditions: (tokenGate.conditions as any)!.accessControlConditions
    });
    const { space } = await charmClient.unlockTokenGate({ jwt, id: tokenGate.id });
    if (space) {
      _onSubmit(space);
    }
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
              endAdornment: tokenGate && <CheckIcon color='success' />
            }}
          />
        </Grid>
        {description && (
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
                  <Typography variant='body2'>
                    Chain:
                    {' '}
                    {tokenGate && getChainName(tokenGate)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item>
              <PrimaryButton fullWidth type='submit' onClick={onSubmit}>
                Verify Wallet
              </PrimaryButton>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );

}

function getChain (tokenGate: TokenGate): Chain {
  return (tokenGate.conditions as any)!.accessControlConditions![0].chain;
}

function getChainName (tokenGate: TokenGate): string | undefined {
  const chain = getChain(tokenGate);
  return ALL_LIT_CHAINS[chain]?.name;
}
