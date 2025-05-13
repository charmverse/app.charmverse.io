import { log } from '@charmverse/core/log';
import { Box, TextField, Typography, Button } from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { useState } from 'react';
import { erc20Abi, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useAccount, useWalletClient } from 'wagmi';

import charmClient from 'charmClient';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSnackbar } from 'hooks/useSnackbar';

const recipientAddress = '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0';
const devTokenAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c';

export function DevPurchaseButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button variant='contained' onClick={() => setIsModalOpen(true)}>
        Send DEV
      </Button>
      <SpaceContributionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}

export function SpaceContributionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(0);
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { showMessage } = useSnackbar();
  const { space } = useCurrentSpace();
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      if (!space) {
        return;
      }

      if (amount === 0) {
        return;
      }

      if (!address || !walletClient) {
        return;
      }

      if (walletClient.chain.id !== 8453) {
        try {
          await walletClient.switchChain({
            id: 8453
          });
        } catch (error) {
          log.warn('Error switching chain for space contribution', { error });
        }
      }

      const transferredAmount = parseUnits(amount.toString(), 18);

      const transferTxHash = await walletClient.writeContract({
        address: devTokenAddress,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [recipientAddress, transferredAmount]
      });

      const publicClient = getPublicClient(base.id);

      const receipt = await publicClient.waitForTransactionReceipt({ hash: transferTxHash });

      if (receipt.status === 'success') {
        showMessage('Transaction sent successfully', 'success');
      } else {
        showMessage('Transaction failed', 'error');
      }

      await charmClient.spaces.createSpaceContribution(space.id, {
        hash: transferTxHash,
        walletAddress: address,
        paidTokenAmount: transferredAmount.toString()
      });
    } catch (error) {
      log.error('Error sending space contribution', { error });
      showMessage('Error sending space contribution', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Send DEV</Typography>
        <TextField
          fullWidth
          type='number'
          value={amount}
          disabled={!address}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
        <Button
          variant='contained'
          onClick={handleSend}
          sx={{ width: 'fit-content' }}
          disabled={isLoading || (address && amount === 0)}
        >
          {address ? 'Send' : 'Connect Wallet'}
        </Button>
      </Box>
    </Modal>
  );
}
