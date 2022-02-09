import { useContext } from 'react';
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import { injected, walletConnect, walletLink } from 'connectors';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import PrimaryButton from 'components/common/PrimaryButton';
import { useWeb3React } from '@web3-react/core';
import CopyableAddress from './CopyableAddress';

export default function WalletConnection () {

  const { account, connector } = useWeb3React();

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
      <Box display='flex' justifyContent='space-between' alignItems='center' my={3}>
        {account ? (
          <CopyableAddress
            address={account}
            decimals={5}
            sx={{ fontSize: 20, background: 'transparent !important', color: 'inherit', px: 0 }}
          />
        ) : <div></div>}
        <Box
          display='flex'
          alignItems='center'
        >
          <Typography color='secondary' variant='body2'>
            {`Connected with ${connectorName(connector)}`}
          </Typography>
          <Button size='small' color='secondary' variant='outlined' onClick={handleWalletProviderSwitch} sx={{ ml: 3 }}>
            Switch
          </Button>
        </Box>
      </Box>
    ) : (
      <PrimaryButton size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
        Connect Wallet
      </PrimaryButton>
    )
  );
}
