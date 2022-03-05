import { humanizeAccessControlConditions, Chain, checkAndSignAuthMessage } from 'lit-js-sdk';
import { useState, useEffect, ChangeEvent } from 'react';
import { useWeb3React } from '@web3-react/core';
import Grid from '@mui/material/Grid';
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

interface Props {
  onSubmit: (values: Space) => void;
}

export default function WorkspaceSettings ({ onSubmit: _onSubmit }: Props) {

  const { account } = useWeb3React();
  const [tokenGate, setTokenGate] = useState<TokenGate | null>(null);
  const [description, setDescription] = useState<string>('');
  const litClient = useLitProtocol();

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
    const spaceDomain = event.target.value.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
    charmClient.getTokenGateForSpace({ spaceDomain })
      .then(gate => {
        setTokenGate(gate);
      });
  }

  return (
    <>
      <DialogTitle>Join a workspace</DialogTitle>
      <Divider />
      <br />
      <Grid container direction='column' spacing={2}>
        <Grid item>
          <FieldLabel>Domain</FieldLabel>
          <TextField
            onChange={onChangeDomainName}
            autoFocus
            fullWidth
            helperText='Enter a URL or the domain of the space you want to join'
            InputProps={{
              endAdornment: tokenGate && <CheckIcon />
            }}
          />
        </Grid>
        {description && (
          <>
            <Grid item>
              <Typography>
                <strong>
                  Requirements for joining:
                </strong>
              </Typography>
              <Typography variant='body2'>
                {description}
              </Typography>
            </Grid>
            <Grid item>
              <PrimaryButton type='submit' onClick={onSubmit}>
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
