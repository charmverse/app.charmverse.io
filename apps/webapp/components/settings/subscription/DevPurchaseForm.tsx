import { Box, Stack, TextField, Typography } from '@mui/material';
import { relativeTime } from '@packages/lib/utils/dates';
import type { SpaceReceipt } from '@packages/spaces/getSpaceReceipts';
import { hasNftAvatar } from '@packages/users/hasNftAvatar';
import { RainbowKitProvider, useConnectModal } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';

import charmClient from 'charmClient';
import Avatar from 'components/common/Avatar';
import { Button } from 'components/common/Button';
import Modal from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useMembers } from 'hooks/useMembers';
import { useSnackbar } from 'hooks/useSnackbar';

import '@rainbow-me/rainbowkit/styles.css';

import { useDevTokenBalance } from './hooks/useDevTokenBalance';
import { useTransferDevToken } from './hooks/useTransferDevToken';
import { SpaceSubscriptionForm } from './SpaceSubscriptionForm';

function SpaceSubscriptionReceiptsList({ spaceReceipts }: { spaceReceipts: SpaceReceipt[] }) {
  const { space } = useCurrentSpace();
  const { members } = useMembers();

  const spaceReceiptsWithUser = spaceReceipts.map((receipt) => ({
    ...receipt,
    user: receipt.type === 'contribution' ? members.find((member) => member.id === receipt.userId)! : undefined
  }));

  return (
    <Stack gap={2} my={2}>
      {spaceReceipts.length === 0 ? (
        <Typography>No space receipts yet</Typography>
      ) : (
        <>
          <Typography variant='h6'>Space receipts</Typography>
          {spaceReceiptsWithUser.map((receipt) => (
            <Stack key={receipt.id} flexDirection='row' justifyContent='space-between' alignItems='center'>
              <Box display='flex' alignItems='center' gap={1}>
                <Avatar
                  name={receipt.user ? receipt.user.username : space?.name}
                  avatar={receipt.user ? receipt.user?.avatar : space?.spaceImage}
                  size='small'
                  isNft={receipt.user ? hasNftAvatar(receipt.user) : false}
                />
                <Box>
                  <Typography variant='body1'>
                    {receipt.user ? `Contribution by ${receipt.user.username}` : 'Monthly Payment'}
                  </Typography>
                </Box>
                <Typography variant='caption' color='text.secondary'>
                  {relativeTime(receipt.createdAt)}
                </Typography>
              </Box>
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <Typography
                  variant='body2'
                  fontWeight={600}
                  color={receipt.type === 'contribution' ? 'success.main' : 'error.main'}
                >
                  {receipt.type === 'contribution' ? '+' : '-'}
                  {formatUnits(BigInt(receipt.paidTokenAmount), 18)}
                </Typography>
                <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
              </Stack>
            </Stack>
          ))}
        </>
      )}
    </Stack>
  );
}

function ConnectWalletButton({ onClose, open }: { onClose: VoidFunction; open: boolean }) {
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { address } = useAccount();

  // we need to keep track of this so we can close the modal when the user cancels
  const [isRainbowKitOpen, setIsRainbowKitOpen] = useState(false);

  useEffect(() => {
    if (!connectModalOpen && isRainbowKitOpen && !address) {
      setIsRainbowKitOpen(false);
      onClose();
    } else if (open && !address) {
      openConnectModal?.();
      setIsRainbowKitOpen(true);
    }
  }, [open, onClose, address, connectModalOpen, openConnectModal, isRainbowKitOpen]);

  return (
    <Button variant='contained' onClick={openConnectModal} sx={{ width: 'fit-content' }}>
      Connect Wallet
    </Button>
  );
}

export function DevPurchaseButton() {
  const { space } = useCurrentSpace();
  const { address } = useAccount();

  const { data: spaceTokenBalance = 0, mutate: refreshSpaceTokenBalance } = useSWR(
    space ? `space-token-balance/${space.id}` : null,
    () => (space ? charmClient.spaces.getSpaceTokenBalance(space.id) : 0)
  );

  const { data: spaceReceipts = [], mutate: refreshSpaceReceipts } = useSWR(
    space ? `space-receipts/${space.id}` : null,
    () => (space ? charmClient.spaces.getSpaceContributions(space.id) : [])
  );

  const [isSendDevModalOpen, setIsSendDevModalOpen] = useState(false);
  const [isSpaceTierPurchaseModalOpen, setIsSpaceTierPurchaseModalOpen] = useState(false);
  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);

  return (
    <>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography>
          Space tier: <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{space?.subscriptionTier}</span>
        </Typography>
      </Stack>
      <Stack flexDirection='row' alignItems='center' gap={0.5}>
        <Typography>Space DEV balance: {spaceTokenBalance} </Typography>
        <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={16} height={16} />
      </Stack>
      <SpaceSubscriptionReceiptsList spaceReceipts={spaceReceipts} />

      {address ? (
        <Stack flexDirection='row' alignItems='center' gap={0.5} mb={2}>
          <Button variant='contained' onClick={() => setIsSendDevModalOpen(true)} sx={{ width: 'fit-content' }}>
            Send DEV
          </Button>
          <Button
            variant='contained'
            onClick={() => setIsSpaceTierPurchaseModalOpen(true)}
            sx={{ width: 'fit-content' }}
          >
            Upgrade
          </Button>
        </Stack>
      ) : (
        <RainbowKitProvider>
          <ConnectWalletButton onClose={() => setIsConnectWalletModalOpen(false)} open={isConnectWalletModalOpen} />
        </RainbowKitProvider>
      )}
      <SpaceContributionModal
        isOpen={isSendDevModalOpen}
        onClose={() => setIsSendDevModalOpen(false)}
        onSuccess={() => {
          refreshSpaceReceipts();
          refreshSpaceTokenBalance();
        }}
      />
      <SpaceSubscriptionForm
        isOpen={isSpaceTierPurchaseModalOpen}
        onClose={() => setIsSpaceTierPurchaseModalOpen(false)}
        spaceTokenBalance={spaceTokenBalance}
        onSuccess={() => {
          refreshSpaceReceipts();
          refreshSpaceTokenBalance();
          setIsSpaceTierPurchaseModalOpen(false);
        }}
      />
    </>
  );
}

function SpaceContributionModal({
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
  const { space } = useCurrentSpace();
  const { showMessage } = useSnackbar();
  const { balance, formattedBalance, isLoading: isBalanceLoading } = useDevTokenBalance({ address });

  const { isTransferring, transferDevToken } = useTransferDevToken({
    amount,
    onSuccess: async ({ hash, signature, message, address: walletAddress, transferredAmount }) => {
      if (!space) {
        return;
      }

      await charmClient.spaces
        .createSpaceContribution(space.id, {
          hash,
          walletAddress,
          paidTokenAmount: transferredAmount.toString(),
          signature,
          message
        })
        .catch((err) => {
          showMessage(err?.message ?? 'The transfer of DEV tokens could not be made. Please try again later.', 'error');
        })
        .then(() => {
          showMessage('DEV tokens sent successfully', 'success');
          onSuccess();
          onClose();
        });
    }
  });

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>Send DEV</Typography>
        <Stack gap={1}>
          <TextField
            fullWidth
            type='number'
            value={amount}
            inputProps={{
              min: 1,
              max: balance
            }}
            disabled={!address || isBalanceLoading}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <Stack flexDirection='row' alignItems='center' gap={0.5}>
            <Typography variant='body2' color='text.secondary'>
              Balance: {formattedBalance}
            </Typography>
            <Image src='/images/logos/dev-token-logo.png' alt='DEV' width={14} height={14} />
          </Stack>
        </Stack>
        <Button
          loading={isTransferring || isBalanceLoading}
          variant='contained'
          onClick={transferDevToken}
          sx={{ width: 'fit-content' }}
          disabled={amount === 0 || balance < amount}
        >
          Send
        </Button>
      </Box>
    </Modal>
  );
}
