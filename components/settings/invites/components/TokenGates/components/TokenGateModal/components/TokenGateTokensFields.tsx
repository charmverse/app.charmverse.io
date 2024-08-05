import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { useFormContext } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { FormValues } from '../hooks/useTokensForm';
import { tokenCheck } from '../utils/utils';

import { TokenGateBlockchainSelect } from './TokenGateBlockchainSelect';

export function TokenGateTokenFields() {
  const {
    register,
    watch,
    formState: { errors }
  } = useFormContext<FormValues>();
  const check = watch('check');

  return (
    <>
      <TokenGateBlockchainSelect
        error={!!errors.chain?.message}
        helperMessage={errors.chain?.message}
        {...register('chain', {
          deps: ['contract']
        })}
      />
      <FieldWrapper label='Type'>
        <Select<FormValues['check']>
          displayEmpty
          fullWidth
          renderValue={(selected) => tokenCheck.find((c) => c.id === selected)?.name || selected || 'Select...'}
          {...register('check')}
        >
          {tokenCheck.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      {(check === 'customToken' || check === 'customContractMethod') && (
        <TextInputField
          label='Contract Address'
          error={errors.contract?.message}
          helperText={errors.contract?.message}
          placeholder='0x0000000000000000000000000000000000000000'
          {...register('contract', {
            deps: ['chain']
          })}
        />
      )}
      {check === 'customContractMethod' && (
        <TextInputField
          label='Contract Method'
          error={errors.method?.message}
          helperText={errors.method?.message}
          placeholder='balanceOf'
          {...register('method', {
            deps: ['chain']
          })}
        />
      )}
      <NumberInputField
        label='Quantity'
        fullWidth
        error={errors.quantity?.message}
        helperText={errors.quantity?.message}
        {...register('quantity')}
      />
    </>
  );
}
