import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { builderDaoChains, litDaoChains } from 'connectors/chains';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { TokenGateConditions } from 'lib/tokenGates/interfaces';

import type { FormValues } from '../hooks/useDaoForm';
import { useDaoForm } from '../hooks/useDaoForm';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getDaoUnifiedAccessControlConditions } from '../utils/getDaoUnifiedAccessControlConditions';
import { daoCheck } from '../utils/utils';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateDao() {
  const {
    register,
    getValues,
    watch,
    formState: { errors, isValid },
    reset
  } = useDaoForm();
  const check = watch('check');
  const chain = watch('chain');

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

  const chains = check === 'builder' ? builderDaoChains : litDaoChains;

  return (
    <>
      <FieldWrapper label='Select a DAO Membership'>
        <Select<FormValues['check']>
          displayEmpty
          fullWidth
          renderValue={(selected) => daoCheck.find((c) => c.id === selected)?.name || selected || 'Select...'}
          {...register('check', {
            deps: ['chain']
          })}
        >
          {daoCheck.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        chains={chains}
        {...register('chain', {
          deps: ['check']
        })}
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
