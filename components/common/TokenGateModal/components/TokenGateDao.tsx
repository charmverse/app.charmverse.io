import { yupResolver } from '@hookform/resolvers/yup';
import { litDaoChains } from 'connectors/chains';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { TokenGateConditions } from 'lib/tokenGates/interfaces';
import { isValidChainAddress } from 'lib/tokens/validation';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getDaoUnifiedAccessControlConditions } from '../utils/getDaoUnifiedAccessControlConditions';

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

export function TokenGateDao() {
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

  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getDaoUnifiedAccessControlConditions(values) || [];
    const _tokenGate: TokenGateConditions = { type: 'lit', conditions: { unifiedAccessControlConditions: valueProps } };
    handleTokenGate(_tokenGate);
    setDisplayedPage('review');
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
        chains={litDaoChains}
        {...register('chain')}
      />
      <TextInputField
        label='DAO Contract Address'
        error={errors.contract?.message}
        helperText={errors.contract?.message}
        {...register('contract')}
      />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
