import { isValidName } from 'ethers/lib/utils';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { TokenGateConditions } from 'lib/tokenGates/interfaces';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { useWalletForm, type FormValues } from '../hooks/useWalletForm';
import { getWalletUnifiedAccessControlConditions } from '../utils/getWalletUnifiedAccessControlConditions';

import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateWallet() {
  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();

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
      contract: initialValues.ensWallet || initialValues.contract
    };
    const valueProps = getWalletUnifiedAccessControlConditions(values) || [];
    const _tokenGate: TokenGateConditions = { type: 'lit', conditions: { unifiedAccessControlConditions: valueProps } };
    handleTokenGate(_tokenGate);
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
      <TextInputField
        label='Wallet address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        onChange={onContractChange}
        {...restRegisterContract}
      />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
