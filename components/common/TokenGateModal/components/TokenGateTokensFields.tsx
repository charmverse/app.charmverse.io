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
        {...register('chain')}
      />
      <FieldWrapper label='Which group should be able to access this asset'>
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
      {check === 'customToken' && (
        <TextInputField
          label='Contract Address'
          error={errors.contract?.message}
          helperText={errors.contract?.message}
          {...register('contract')}
        />
      )}
      <NumberInputField
        label='Quantity'
        error={errors.quantity?.message}
        helperText={errors.quantity?.message}
        {...register('quantity')}
      />
    </>
  );
}
