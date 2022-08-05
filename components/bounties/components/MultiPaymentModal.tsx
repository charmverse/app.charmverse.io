
import { ethers } from 'ethers';
import { Modal, DialogTitle } from 'components/common/Modal';
import Button from 'components/common/Button';
import Box from '@mui/material/Box';
import charmClient from 'charmClient';
import { bindTrigger, bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import { useBounties } from 'hooks/useBounties';
import { eToNumber } from 'lib/utilities/numbers';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useEffect, useMemo, useState } from 'react';
import { Checkbox, List, ListItem, Tooltip, Typography } from '@mui/material';
import UserDisplay from 'components/common/UserDisplay';
import { useContributors } from 'hooks/useContributors';
import { BountyWithDetails } from 'models';
import { Bounty } from '@prisma/client';
import { getChainById } from 'connectors';
import useGnosisSigner from 'hooks/useWeb3Signer';
import { useWeb3React } from '@web3-react/core';
import useSWR from 'swr';
import { getSafesForAddress, SafeData } from 'lib/gnosis';
import { shortenHex } from 'lib/utilities/strings';
import { isTruthy } from 'lib/utilities/types';
import MultiPaymentButton, { MultiPaymentResult } from './MultiPaymentButton';
import { BountyAmount } from './BountyStatusBadge';

interface TransactionWithMetadata extends MetaTransactionData, Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId'>{
  applicationId: string
  userId: string
  title: string
}

export default function MultiPaymentModal ({ bounties }: {bounties: BountyWithDetails[]}) {
  const [isLoading, setIsLoading] = useState(false);
  const { setBounties, setCurrentBounty, currentBountyId } = useBounties();
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const [currentSpace] = useCurrentSpace();
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>([]);
  const [contributors] = useContributors();
  const { account, chainId } = useWeb3React();
  const signer = useGnosisSigner();
  const { data: safeInfos } = useSWR(
    (signer && account && chainId) ? `/connected-gnosis-safes/${account}` : null,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    () => getSafesForAddress({ signer: signer!, chainId: chainId!, address: account! })
  );

  // use first multisig wallet
  const multiSigWallet = (safeInfos || [])[0] as SafeData | undefined;
  const gnosisSafeAddress = multiSigWallet?.address;
  const gnosisSafeChainId = multiSigWallet?.chainId;

  // If the bounty is on the same chain as the gnosis safe and the rewardToken of the bounty is the same as the native currency of the gnosis safe chain
  const transactions: TransactionWithMetadata[] = useMemo(
    () => bounties
      .filter(bounty => {
        return bounty.chainId === gnosisSafeChainId
        && bounty.rewardToken === getChainById(gnosisSafeChainId)?.nativeCurrency.symbol;
      })
      .map(bounty => {
        return bounty.applications.map(application => {
          if (application.status === 'complete') {
            const value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
            return {
              to: application.walletAddress as string,
              value,
              // This has to be 0x don't change it
              data: '0x',
              applicationId: application.id,
              userId: application.createdBy,
              chainId: bounty.chainId,
              rewardAmount: bounty.rewardAmount,
              rewardToken: bounty.rewardToken,
              title: bounty.page?.title || 'Untitled'
            };
          }
          return false;
        }).filter(isTruthy);
      })
      .flat(),
    [bounties, gnosisSafeChainId]
  );

  useEffect(() => {
    const applicationIds = transactions.map(transaction => transaction.applicationId);
    setSelectedApplicationIds(applicationIds);
  }, [transactions]);

  // A record to keep track of application id an its corresponding transaction
  const applicationTransactionRecord: Record<string, TransactionWithMetadata> = {};
  transactions.forEach(transaction => {
    applicationTransactionRecord[transaction.applicationId] = transaction;
  });

  async function onPaymentSuccess (result: MultiPaymentResult) {
    if (gnosisSafeAddress && gnosisSafeChainId) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: gnosisSafeChainId.toString()
          });
          await charmClient.markSubmissionAsPaid(transaction.applicationId);
        })
      );

      if (currentSpace) {
        charmClient.listBounties(currentSpace.id)
          .then(_bounties => {
            setBounties(_bounties);
            const newCurrentBounty = _bounties.find(_bounty => _bounty.id === currentBountyId);
            if (newCurrentBounty) {
              setCurrentBounty({ ...newCurrentBounty });
            }
          });
      }
      setIsLoading(false);
      setSelectedApplicationIds([]);
      popupState.close();
    }
  }

  const isDisabled = !gnosisSafeChainId || !gnosisSafeAddress || transactions.length === 0;

  return (
    <>
      <Tooltip arrow placement='top' title={isDisabled ? `Batch payment requires at least one Completed bounty on the ${getChainById(gnosisSafeChainId || 1)?.chainName} network` : ''}>
        <div>
          <Button
            {...bindTrigger(popupState)}
            sx={{ ml: 1 }}
            variant='outlined'
            color='secondary'
            disabled={isDisabled}
          >
            Batch Payment ({selectedApplicationIds.length})
          </Button>
        </div>
      </Tooltip>
      {!isDisabled && (
        <Modal {...bindPopover(popupState)} size='large'>
          <DialogTitle onClose={popupState.close}>
            Pay Bount{transactions.length > 1 ? 'ies' : 'y'}
          </DialogTitle>
          <Box pb={2}>
            <List>
              {transactions.map(({ title, chainId: _chainId, rewardAmount, rewardToken, userId, applicationId }) => {
                const user = contributors.find(contributor => contributor.id === userId);
                const isChecked = selectedApplicationIds.includes(applicationId);
                if (user) {
                  return (
                    <ListItem key={`${userId}.${_chainId}.${applicationId}`}>
                      <Checkbox
                        disableFocusRipple
                        disableRipple
                        disableTouchRipple
                        sx={{
                          p: 0,
                          pr: 1
                        }}
                        size='medium'
                        checked={isChecked}
                        onChange={(event) => {
                          if (!event.target.checked) {
                            const ids = selectedApplicationIds.filter(selectedApplicationId => selectedApplicationId !== applicationId);
                            setSelectedApplicationIds(ids);
                          }
                          else {
                            setSelectedApplicationIds([...selectedApplicationIds, applicationId]);
                          }
                        }}
                      />
                      <Box display='flex' justifyContent='space-between' sx={{ width: '100%' }}>
                        <Box display='flex' gap={2} alignItems='center'>
                          <UserDisplay
                            avatarSize='small'
                            user={user}
                          />
                          <Typography variant='body2' color='secondary'>
                            {title}
                          </Typography>
                        </Box>
                        <BountyAmount
                          bounty={{
                            chainId: _chainId,
                            rewardAmount,
                            rewardToken
                          }}
                        />
                      </Box>
                    </ListItem>
                  );
                }
                return null;
              })}

            </List>
          </Box>
          <Box display='flex' gap={2} alignItems='center'>
            <MultiPaymentButton
              chainId={gnosisSafeChainId}
              safeAddress={gnosisSafeAddress}
              transactions={selectedApplicationIds.map(selectedApplicationId => applicationTransactionRecord[selectedApplicationId])}
              onSuccess={onPaymentSuccess}
              isLoading={isLoading}
            />

            <Typography color='secondary' variant='caption'>Safe address: {shortenHex(gnosisSafeAddress)}</Typography>
          </Box>
        </Modal>
      )}
    </>
  );
}
