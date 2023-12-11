import { yupResolver } from '@hookform/resolvers/yup';
import { FormHelperText } from '@mui/material';
import { unlockChains } from 'connectors/chains';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useReviewLock } from 'charmClient/hooks/tokenGates';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { isValidChainAddress } from 'lib/tokens/validation';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';
import { TokenGateFooter } from './TokenGateFooter';

const schema = yup.object({
  chain: yup.string().required('Chain is required'),
  contract: yup
    .string()
    .required('Contract is required')
    .test('isAddress', 'Invalid address', (value) => isValidChainAddress(value))
});

export type FormValues = yup.InferType<typeof schema>;

export function TokenGateUnlockProtocol() {
  const {
    register,
    getValues,
    reset,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { contract: '', chain: '' }
  });

  const { setDisplayedPage, handleLock } = useTokenGateModal();
  const { trigger, isMutating, error } = useReviewLock();

  const onSubmit = async () => {
    const values = getValues();
    const lockData = await trigger({ chainId: Number(values.chain), contract: values.contract });

    if (lockData) {
      handleLock(lockData);
      setDisplayedPage('review');
    }
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        chains={unlockChains}
        {...register('chain')}
      />
      <TextInputField
        label='Lock Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        {...register('contract')}
      />
      {error?.message && <FormHelperText error>{error?.message}</FormHelperText>}
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} loading={isMutating} />
    </>
  );
}
