import { useContext } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import { injected, walletConnect, walletLink } from 'connectors';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import PrimaryButton from 'components/common/PrimaryButton';
import { useWeb3React } from '@web3-react/core';
import useENSName from 'hooks/useENSName';
import CopyableAddress from './CopyableAddress';

export default function WalletConnection () {

  const { account, connector } = useWeb3React();
  const ensName = useENSName(account);

  const { openWalletSelectorModal, triedEager } = useContext(Web3Connection);

  const handleWalletProviderSwitch = () => {
    openWalletSelectorModal();
  };

  const connectorName = (c: any) => {
    switch (c) {
      case injected:
        return 'MetaMask';
      case walletConnect:
        return 'WalletConnect';
      case walletLink:
        return 'Coinbase Wallet';
      default:
        return '';
    }
  };

  return (
    account ? (
      <Grid container my={3}>
        <Grid item xs={12} md={6}>
          <Typography sx={{ display: 'flex', alignItems: 'center', fontSize: 20, color: 'inherit', px: 0 }}>
            <Grid container>
              {ensName && (
                <Grid item xs={12} md={6}>
                  <Box mr={6}>{ensName}</Box>
                </Grid>
              )}
              <Grid item xs={12} md={6}>
                {account ? (
                  <CopyableAddress
                    address={account}
                    decimals={5}
                    sx={{ fontSize: ensName ? 16 : 20, fontWeight: 'normal', background: 'transparent !important', color: 'inherit', p: 0 }}
                  />
                ) : <div></div>}
              </Grid>
            </Grid>
          </Typography>
        </Grid>
        <Grid item xs={12} md={6} container alignItems='center' sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
          <Typography color='secondary' variant='body2'>
            {`Connected with ${connectorName(connector)}`}
          </Typography>
          <Button size='small' color='secondary' variant='outlined' onClick={handleWalletProviderSwitch} sx={{ ml: 3 }}>
            Switch
          </Button>
        </Grid>
      </Grid>
    ) : (
      <PrimaryButton size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
        Connect Wallet
      </PrimaryButton>
    )
  );
}
