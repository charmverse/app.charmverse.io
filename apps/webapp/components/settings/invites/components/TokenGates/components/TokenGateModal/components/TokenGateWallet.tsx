import { TextInputField } from 'components/common/form/fields/TextInputField';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { useWalletForm, type FormValues } from '../hooks/useWalletForm';
import { getWalletAccessControlConditions } from '../utils/getWalletAccessControlConditions';

import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateWallet() {
  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();

  const {
    getValues,
    reset,
    setValue,
    register,
    formState: { errors, isValid },
    resolveEnsAddress
  } = useWalletForm();

  const onSubmit = async () => {
    const initialValues = getValues();
    const values: FormValues = {
      contract: initialValues.ensWallet || initialValues.contract
    };
    const valueProps = getWalletAccessControlConditions(values) || [];
    handleTokenGate({ conditions: { accessControlConditions: valueProps } });
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
    if (value.endsWith('.eth')) {
      const address = await resolveEnsAddress(value);
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
