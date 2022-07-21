import { Divider, TextField } from '@mui/material';
import { PaymentMethod } from '@prisma/client';
import { BountyStatusChip } from 'components/bounties/components/BountyStatusBadge';
import Switch from 'components/common/BoardEditor/focalboard/src/widgets/switch';
import InputSearchBlockchain from 'components/common/form/InputSearchBlockchain';
import { InputSearchCrypto } from 'components/common/form/InputSearchCrypto';
import { CryptoCurrency, getChainById } from 'connectors';
import { useBounties } from 'hooks/useBounties';
import { usePaymentMethods } from 'hooks/usePaymentMethods';
import { UpdateableBountyFields } from 'lib/bounties';
import debouncePromise from 'lib/utilities/debouncePromise';
import { isTruthy } from 'lib/utilities/types';
import { BountyWithDetails } from 'models';
import { useEffect, useState } from 'react';

export default function BountyProperties (props: {readOnly?: boolean, bounty: BountyWithDetails}) {
  const { bounty, readOnly = false } = props;
  const [paymentMethods] = usePaymentMethods();
  const { updateBounty } = useBounties();
  const [availableCryptos, setAvailableCryptos] = useState<Array<string | CryptoCurrency>>([]);

  const [currentBounty, setCurrentBounty] = useState<BountyWithDetails>(bounty);
  const [capSubmissions, setCapSubmissions] = useState(false);

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

  const debouncedBountyUpdate = debouncePromise(async (bountyId, updates: Partial<UpdateableBountyFields>) => {
    updateBounty(bountyId, updates);
  }, 2500);

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
  }, [currentBounty.chainId, currentBounty.rewardToken, currentBounty.approveSubmitters]);

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
          onChange={(e) => {
            setCurrentBounty((_currentBounty) => ({ ..._currentBounty,
              rewardAmount: Number(e.target.value)
            }));
            debouncedBountyUpdate(currentBounty.id, {
              rewardAmount: Number(e.target.value)
            });
          }}
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
        <div className='octo-propertyname'>Submissions limit</div>
        <Switch
          isOn={capSubmissions}
          onChanged={(isOn) => {
            setCapSubmissions(isOn);
            setCurrentBounty((_currentBounty) => ({ ..._currentBounty, maxSubmissions: isOn ? 1 : _currentBounty.maxSubmissions }));
          }}
          readOnly={readOnly}
        />
      </div>

      {capSubmissions && (
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
          onChange={(e) => {
            setCurrentBounty((_currentBounty) => ({ ..._currentBounty,
              maxSubmissions: Number(e.target.value)
            }));
            debouncedBountyUpdate(currentBounty.id, {
              maxSubmissions: Number(e.target.value)
            });
          }}
        />
      </div>
      )}

    </div>
  );
}
