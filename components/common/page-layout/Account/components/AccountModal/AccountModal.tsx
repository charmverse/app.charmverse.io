import { Modal } from 'components/common/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from 'components/common/Button';
import { useWeb3React } from '@web3-react/core';
import CopyableAddress from 'components/common/CopyableAddress';
import GuildAvatar from 'components/common/Avatar';
import { useUser } from 'hooks/useUser';
import { injected, walletConnect, walletLink } from 'connectors';
import { useContext } from 'react';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import AccountConnections from './components/AccountConnections';

function AccountModal ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { account, connector } = useWeb3React();
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const [user] = useUser();
  const { discordId, isLoading } = user || {};

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
      <Typography variant='h3'>Account</Typography>
      <Box mb={9} display='flex' flexDirection='row' padding={4} alignItems='center'>
        <GuildAvatar name={account} />
        {account && <CopyableAddress address={account} decimals={5} />}
      </Box>
      <Box
        display='flex'
        flexDirection='row'
        alignItems='center'
        justifyContent='space-between'
        mb='-1'
      >
        <Typography color='secondary' fontSize='sm' fontWeight='medium'>
          {`Connected with ${connectorName(connector)}`}
        </Typography>
        <Button size='small' variant='outlined' onClick={handleWalletProviderSwitch}>
          Switch
        </Button>
      </Box>
      {/* {(discordId || isLoading) && (
        <ModalFooter bg={modalFooterBg} flexDir='column' pt='10'>
          <AccountConnections />
        </ModalFooter>
      )} */}
    </Modal>
  );
}

export default AccountModal;
