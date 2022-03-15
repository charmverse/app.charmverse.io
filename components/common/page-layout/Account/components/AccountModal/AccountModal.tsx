
import { useWeb3React } from '@web3-react/core';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import CopyableAddress from 'components/common/CopyableAddress';
import Avatar from 'components/common/Avatar';
import { Modal, DialogTitle } from 'components/common/Modal';
import { injected, walletConnect, walletLink } from 'connectors';
import { useContext } from 'react';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
// import AccountConnections from './components/AccountConnections';

function AccountModal ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { account, connector } = useWeb3React();
  const { openWalletSelectorModal } = useContext(Web3Connection);

  const handleWalletProviderSwitch = () => {
    openWalletSelectorModal();
    onClose();
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
    <Modal open={isOpen} onClose={onClose}>
      <DialogTitle onClose={onClose}>Account</DialogTitle>
      <Stack mb={9} direction='row' spacing='4' alignItems='center'>
        <Avatar name={account} />
        <CopyableAddress address={account!} decimals={5} sx={{ fontSize: 24 }} />
      </Stack>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        mb='-1'
      >
        <Typography color='secondary'>
          {`Connected with ${connectorName(connector)}`}
        </Typography>
        <Button size='small' variant='outlined' onClick={handleWalletProviderSwitch}>
          Switch
        </Button>
      </Stack>
    </Modal>
  );
}

export default AccountModal;
