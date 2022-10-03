import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useWeb3React } from '@web3-react/core';
import { supportedChains, walletConnect } from 'connectors';

import processConnectionError from 'components/_app/Web3ConnectionManager/components/WalletSelectorModal/utils/processConnectionError';
import ErrorComponent from 'components/common/errors/WalletError';
import { Modal, DialogTitle } from 'components/common/Modal';

import NetworkButton from './components/NetworkButton';
import requestNetworkChange from './utils/requestNetworkChange';

function NetworkModal ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { error, connector, active } = useWeb3React();
  // const toast = useToast();

  // const requestManualNetworkChange = (chain: string) => () => toast({
  //   title: "Your wallet doesn't support switching chains automatically",
  //   description: `Please switch to ${chain} from your wallet manually!`,
  //   status: 'error'
  // });

  return (
    <Modal open={isOpen} onClose={onClose} size='large'>
      <DialogTitle onClose={onClose}>{active ? 'Supported networks' : 'Select network'}</DialogTitle>
      <Typography mb={4}>
        It doesn't matter which supported chain you're connected to, it's only
        used to know your address and sign messages so each will work equally.
      </Typography>
      <ErrorComponent error={error} processError={processConnectionError} />
      <Grid container spacing={2}>
        {supportedChains.map((chain) => (
          <Grid item key={chain} xs={12} sm={6}>
            <NetworkButton
              key={chain}
              chain={chain}
              requestNetworkChange={
                connector === walletConnect
                  ? () => {} // requestManualNetworkChange(chain)
                  : requestNetworkChange(chain, onClose)
              }
            />
          </Grid>
        ))}
      </Grid>
    </Modal>
  );
}

export default NetworkModal;
