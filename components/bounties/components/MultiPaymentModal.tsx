
import { ethers } from 'ethers';
import { Modal, DialogTitle } from 'components/common/Modal';
import Button from 'components/common/Button';
import Box from '@mui/material/Box';
import charmClient from 'charmClient';
import { bindTrigger, bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { MetaTransactionData } from '@gnosis.pm/safe-core-sdk-types';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { useBounties } from 'hooks/useBounties';
import { eToNumber } from 'lib/utilities/numbers';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useEffect, useState } from 'react';
import { Checkbox, List, ListItem, Typography } from '@mui/material';
import UserDisplay from 'components/common/UserDisplay';
import { useContributors } from 'hooks/useContributors';
import { BountyWithDetails } from 'models';
import { Bounty } from '@prisma/client';
import { getChainById } from 'connectors';
import MultiPaymentButton, { MultiPaymentResult } from './MultiPaymentButton';
import { BountyAmount } from './BountyStatusBadge';

interface TransactionWithMetadata extends MetaTransactionData, Pick<Bounty, 'rewardToken' | 'rewardAmount' | 'chainId' | 'title'>{
  applicationId: string
  userId: string
}

export default function MultiPaymentModal ({ bounties }: {bounties: BountyWithDetails[]}) {
  const [isLoading, setIsLoading] = useState(false);
  const { setBounties, setCurrentBounty, currentBountyId } = useBounties();
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const [paymentMethods] = usePaymentMethods();
  const [currentSpace] = useCurrentSpace();
  // Find the first gnosis safe payment method
  const gnosisPayment = paymentMethods.find(p => p.walletType === 'gnosis');
  const safeAddress = gnosisPayment?.gnosisSafeAddress;
  const [transactions, setTransactions] = useState<TransactionWithMetadata[]>([]);
  const [selectedApplicationIds, setSelectedApplicationIds] = useState<string[]>(transactions.map(transaction => transaction.applicationId));
  const [contributors] = useContributors();

  useEffect(() => {
    const _transactions: TransactionWithMetadata[] = [];
    if (gnosisPayment) {

      bounties.forEach(bounty => {
        // If the bounty is on the same chain as the gnosis safe and the rewardToken of the bounty is the same as the native currency of the gnosis safe chain
        if (bounty.chainId === gnosisPayment?.chainId && bounty.rewardToken === getChainById(gnosisPayment.chainId)?.nativeCurrency.symbol) {
          bounty.applications.forEach(application => {
            if (application.status === 'complete') {
              const value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
              _transactions.push({
                to: application.walletAddress as string,
                value,
                // This has to be 0x don't change it
                data: '0x',
                applicationId: application.id,
                userId: application.createdBy,
                chainId: bounty.chainId,
                rewardAmount: bounty.rewardAmount,
                rewardToken: bounty.rewardToken,
                title: bounty.title
              });
            }
          });
        }
      });
    }

    setTransactions(_transactions);
    setSelectedApplicationIds(_transactions.map(transaction => transaction.applicationId));
  }, [bounties, gnosisPayment]);

  // A record to keep track of application id an its corresponding transaction
  const applicationTransactionRecord: Record<string, TransactionWithMetadata> = {};
  transactions.forEach(transaction => {
    applicationTransactionRecord[transaction.applicationId] = transaction;
  });

  async function onPaymentSuccess (result: MultiPaymentResult) {
    if (gnosisPayment) {
      setIsLoading(true);
      await Promise.all(
        result.transactions.map(async (transaction) => {
          await charmClient.recordTransaction({
            applicationId: transaction.applicationId,
            transactionId: result.txHash,
            chainId: gnosisPayment.chainId.toString()
          });
          await charmClient.paySubmission(transaction.applicationId);
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
      setTransactions([]);
      popupState.close();
    }
  }

  if (!safeAddress || transactions.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        {...bindTrigger(popupState)}
        sx={{ ml: 1 }}
        variant='outlined'
        color='secondary'
      >
        Batch Payment ({selectedApplicationIds.length})
      </Button>
      <Modal {...bindPopover(popupState)} size='large'>
        <DialogTitle onClose={popupState.close}>Batch Payments</DialogTitle>
        <Box pb={2}>
          <List>
            {transactions.map(({ title, chainId, rewardAmount, rewardToken, userId, applicationId }) => {
              const user = contributors.find(contributor => contributor.id === userId);
              const isChecked = selectedApplicationIds.includes(applicationId);
              if (user) {
                return (
                  <ListItem>
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
                          setSelectedApplicationIds(selectedApplicationIds.filter(selectedApplicationId => selectedApplicationId !== applicationId));
                        }
                        else {
                          setSelectedApplicationIds([...selectedApplicationIds, applicationId]);
                        }
                      }}
                    />
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                    >
                      <Box sx={{
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center'
                      }}
                      >
                        <UserDisplay avatarSize='small' user={user} />
                        <Typography fontWeight='semibold' color='secondary'>
                          {title}
                        </Typography>
                      </Box>
                      <BountyAmount
                        bounty={{
                          chainId,
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
        <MultiPaymentButton
          chainId={gnosisPayment.chainId}
          safeAddress={safeAddress}
          transactions={selectedApplicationIds.map(selectedApplicationId => applicationTransactionRecord[selectedApplicationId])}
          onSuccess={onPaymentSuccess}
          isLoading={isLoading}
        />
      </Modal>
    </>
  );
}
