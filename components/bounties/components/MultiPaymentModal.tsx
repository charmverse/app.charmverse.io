
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
import { isTruthy } from 'lib/utilities/types';
import MultiPaymentButton, { MultiPaymentResult } from './MultiPaymentButton';

export default function MultiPaymentModal () {

  const { bounties, setBounties } = useBounties();
  const popupState = usePopupState({ variant: 'popover', popupId: 'multi-payment-modal' });
  const [paymentMethods] = usePaymentMethods();

  const gnosisPayment = paymentMethods.find(p => p.walletType === 'gnosis');
  const safeAddress = gnosisPayment?.gnosisSafeAddress;
  const bountiesReady = bounties.filter(bounty => bounty.chainId === gnosisPayment?.chainId && bounty.status === 'complete');

  async function onPaymentSuccess (result: MultiPaymentResult) {
    const updatedBounties = await Promise.all(
      result.transactions.map(async (transaction, i) => {
        const bountyId = bountiesReady[i].id;
        await charmClient.recordTransaction({
          bountyId,
          transactionId: result.txHash,
          chainId: gnosisPayment!.chainId.toString()
        });
        return charmClient.changeBountyStatus(bountyId, 'paid');
      })
    );
    setBounties(_bounties => _bounties.map(bounty => {
      const updated = updatedBounties.find(b => b.id === bounty.id);
      return updated || bounty;
    }));
  }

  if (!safeAddress || bountiesReady.length === 0) {
    return null;
  }

  const transactions: MetaTransactionData[] = bountiesReady.map(bounty => {
    const app = bounty.applications.find(application => application.createdBy === bounty.assignee);
    if (!app) return null;
    const value = ethers.utils.parseUnits(eToNumber(bounty.rewardAmount), 18).toString();
    return {
      to: app.walletAddress,
      value,
      data: '0x',
      origin: 'CharmVerse Bounty'
    };
  }).filter(isTruthy);

  return (
    <>
      <Button
        {...bindTrigger(popupState)}
        sx={{ ml: 1 }}
      >
        Batch Payment ({bountiesReady.length})
      </Button>
      <Modal {...bindPopover(popupState)} size='fluid'>
        <DialogTitle onClose={popupState.close}>Batch Payments</DialogTitle>
        <Box py={2}>
          <ul>
            {bountiesReady.map(bounty => (
              <li>{bounty.title}</li>
            ))}
          </ul>
        </Box>
        <MultiPaymentButton
          chainId={bountiesReady[0].chainId}
          safeAddress={safeAddress}
          transactions={transactions}
          onSuccess={onPaymentSuccess}
        />
      </Modal>
    </>
  );
}
