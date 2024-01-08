import { yupResolver } from '@hookform/resolvers/yup';
import { MenuItem, Select } from '@mui/material';
import { litDaoChains } from 'connectors/chains';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { TokenGateConditions } from 'lib/tokenGates/interfaces';
import { isValidChainAddress } from 'lib/tokens/validation';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getDaoUnifiedAccessControlConditions } from '../utils/getDaoUnifiedAccessControlConditions';
import { daoCheck } from '../utils/utils';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';
import { TokenGateFooter } from './TokenGateFooter';

type DaoOptions = (typeof daoCheck)[number]['id'];

const schema = yup.object({
  chain: yup.string().when('check', {
    is: (val: DaoOptions) => val === 'moloch',
    then: () => yup.string().required('Chain is required'),
    otherwise: () => yup.string()
  }),
  check: yup.string<DaoOptions>().required('DAO type is required'),
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
    watch,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    mode: 'onChange',
    defaultValues: { contract: '', chain: '', check: undefined }
  });

  const check = watch('check');

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
      <FieldWrapper label='Select a DAO Membership'>
        <Select<FormValues['check']>
          displayEmpty
          fullWidth
          renderValue={(selected) => daoCheck.find((c) => c.id === selected)?.name || selected || 'Select...'}
          {...register('check')}
        >
          {daoCheck.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      {check === 'moloch' && (
        <TokenGateBlockchainSelect
          error={!!errors.chain?.message}
          helperMessage={errors.chain?.message}
          chains={litDaoChains}
          {...register('chain')}
        />
      )}
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
