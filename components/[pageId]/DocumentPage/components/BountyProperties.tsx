import { Divider, TextField } from '@mui/material';
import { PaymentMethod } from '@prisma/client';
import { BountyStatusChip } from 'components/bounties/components/BountyStatusBadge';
import SelectProperty from 'components/common/BoardEditor/focalboard/src/components/properties/select/select';
import Editable from 'components/common/BoardEditor/focalboard/src/widgets/editable';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { UpdateableBountyFields } from 'lib/bounties';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails } from 'models';
import { useEffect, useState } from 'react';

export default function BountyProperties (props: {readOnly?: boolean, bounty: BountyWithDetails}) {
  const { bounty, readOnly = false } = props;
  const [paymentMethods] = usePaymentMethods();
  const { updateBounty } = useBounties();
  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);

  const [currentBounty, setCurrentBounty] = useState<BountyWithDetails>(bounty);

  function refreshCryptoList (chainId: number, rewardToken?: string) {

    // Set the default chain currency
    const selectedChain = getChainById(chainId);

    if (selectedChain) {

      const nativeCurrency = selectedChain.nativeCurrency.symbol;

      const cryptosToDisplay = [nativeCurrency];

      const contractAddresses = paymentMethods
        .filter(method => method.chainId === chainId)
        .map(method => {
          return method.contractAddress;
        })
        .filter(isTruthy);
      cryptosToDisplay.push(...contractAddresses);

      setAvailableCryptos(cryptosToDisplay);
      setCurrentBounty((_currentBounty) => ({ ..._currentBounty, rewardToken: rewardToken || nativeCurrency }));
    }
  }

  function onNewPaymentMethod (paymentMethod: PaymentMethod) {
    if (paymentMethod.contractAddress) {
      setCurrentBounty((_currentBounty) => ({ ..._currentBounty, chainId: paymentMethod.chainId }));
      refreshCryptoList(paymentMethod.chainId, paymentMethod.contractAddress);
    }
  }

  useEffect(() => {
    refreshCryptoList(bounty.chainId, bounty.rewardToken);
  }, []);

  useEffect(() => {
    async function update () {
      const updates: UpdateableBountyFields = {
        rewardAmount: currentBounty.rewardAmount,
        rewardToken: currentBounty.rewardToken,
        chainId: currentBounty.chainId,
        approveSubmitters: currentBounty.approveSubmitters === null ? undefined : currentBounty.approveSubmitters,
        maxSubmissions: currentBounty.maxSubmissions
      };
      await updateBounty(currentBounty.id, updates);
    }

    update();
  }, [currentBounty]);

  return (
    <div className='octo-propertylist CardDetailProperties'>
      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Status</div>
        <BountyStatusChip
          size='small'
          status={currentBounty.status}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Chain</div>
        <InputSearchBlockchain
          chainId={currentBounty.chainId}
          sx={{
            width: 250
          }}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Token</div>
        <InputSearchCrypto
          cryptoList={availableCryptos}
          chainId={currentBounty?.chainId}
          defaultValue={currentBounty?.rewardToken}
          value={currentBounty.rewardToken}
          hideBackdrop={true}
          onChange={newToken => {
            setCurrentBounty((_currentBounty) => ({ ..._currentBounty, rewardToken: newToken }));
          }}
          onNewPaymentMethod={onNewPaymentMethod}
          sx={{
            width: 250
          }}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Amount</div>
        <TextField
          required
          sx={{
            width: 250
          }}
          value={currentBounty.rewardAmount}
          type='number'
          size='small'
          inputProps={{ step: 0.000000001 }}
        />
      </div>
      <Divider sx={{
        my: 1
      }}
      />
      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Require applications</div>
        <Switch
          isOn={Boolean(currentBounty.approveSubmitters)}
          onChanged={(isOn) => {
            setCurrentBounty((_currentBounty) => ({ ..._currentBounty, approveSubmitters: isOn }));
          }}
          readOnly={readOnly}
        />
      </div>

      <div className='octo-propertyrow'>
        <div className='octo-propertyname'>Max submissions</div>
        <TextField
          required
          value={currentBounty.maxSubmissions}
          type='number'
          size='small'
          inputProps={{ step: 1, min: 1 }}
          sx={{
            width: 250
          }}
        />
      </div>

    </div>
  );
}
