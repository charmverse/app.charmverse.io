import { log } from '@charmverse/core/log';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { getPublicClient } from '@packages/blockchain/getPublicClient';
import { hasNftAvatar } from '@root/lib/users/hasNftAvatar';
import { relativeTime } from '@root/lib/utils/dates';
import { useState } from 'react';
import useSWR from 'swr';
import { erc20Abi, formatUnits, parseUnits } from 'viem';
import { base } from 'viem/chains';
import { useAccount, useWalletClient } from 'wagmi';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';

const recipientAddress = '0x84a94307CD0eE34C8037DfeC056b53D7004f04a0';
const devTokenAddress = '0x047157cffb8841a64db93fd4e29fa3796b78466c';

function SpaceContributionsList() {
  const { space } = useCurrentSpace();
  const { members } = useMembers();

  const { data: spaceContributions = [] } = useSWR(space ? `space-contributions/${space.id}` : null, () =>
    space ? charmClient.spaces.getSpaceContributions(space.id) : []
  );

  const spaceContributionsWithUser = spaceContributions
    .map((contribution) => ({
      ...contribution,
      user: members.find((member) => member.id === contribution.userId)!
    }))
    .filter((contribution) => contribution.user);

  return (
    <Stack gap={2} my={2}>
      {spaceContributions.length === 0 ? (
        <Typography>No space contributions yet</Typography>
      ) : (
        <>
          <Typography variant='h6'>Space contributions</Typography>
          {spaceContributionsWithUser.map((contribution) => (
            <Stack key={contribution.id} flexDirection='row' justifyContent='space-between' alignItems='center'>
              <Box display='flex' alignItems='center' gap={1}>
                <Avatar
                  name={contribution.user.username}
                  avatar={contribution.user?.avatar}
                  size='small'
                  isNft={hasNftAvatar(contribution.user)}
                />
                <Box>
                  <Typography variant='body1'>{contribution.user.username}</Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  {relativeTime(contribution.createdAt)}
                </Typography>
              </Box>
              <Typography variant='body2' fontWeight={600} color='success.main'>
                +{formatUnits(BigInt(contribution.paidTokenAmount), 18)} DEV
              </Typography>
            </Stack>
          ))}
        </>
      )}
    </Stack>
  );
}

export function DevPurchaseButton() {
  const { space } = useCurrentSpace();

  const { data: spaceTokenBalance, mutate } = useSWR(space ? `space-token-balance/${space.id}` : null, () =>
    space ? charmClient.spaces.getSpaceTokenBalance(space.id) : 0
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Typography>Space token balance: {spaceTokenBalance} DEV</Typography>
      <SpaceContributionsList />
      <Button variant='contained' onClick={() => setIsModalOpen(true)}>
        Send DEV
      </Button>
      <SpaceContributionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} />
    </>
  );
}

export function SpaceContributionModal({
  isOpen,
  onClose,
  onSuccess
}: {
  isOpen: boolean;
  onClose: VoidFunction;
  onSuccess: VoidFunction;
}) {
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

      onSuccess();
      onClose();
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
