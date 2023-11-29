import { isValidName } from 'ethers/lib/utils';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { useWalletForm, type FormValues } from '../hooks/useWalletForm';
import { getWalletUnifiedAccessControlConditions } from '../utils/getWalletUnifiedAccessControlConditions';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateWallet() {
  const { setDisplayedPage, handleUnifiedAccessControlConditions } = useTokenGateModal();

  const {
    getValues,
    reset,
    setValue,
    register,
    formState: { errors, isValid },
    provider
  } = useWalletForm();

  const onSubmit = async () => {
    const initialValues = getValues();
    const values: FormValues = {
      chain: initialValues.chain,
      contract: initialValues.ensWallet || initialValues.contract
    };
    const valueProps = getWalletUnifiedAccessControlConditions(values) || [];
    handleUnifiedAccessControlConditions(valueProps);
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  const { onChange, ...restRegisterContract } = register('contract');

  const onContractChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e);
    const value = e.target.value;
    if (value.endsWith('.eth') && isValidName(value)) {
      const address = await provider?.resolveName(value);
      if (address) {
        setValue('ensWallet', address);
      } else {
        setValue('ensWallet', undefined);
      }
    } else {
      setValue('ensWallet', undefined);
    }
  };

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        {...register('chain')}
      />
      <TextInputField
        label='Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        onChange={onContractChange}
        {...restRegisterContract}
      />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
