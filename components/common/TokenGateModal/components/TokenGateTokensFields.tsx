import { FormHelperText, ListItemIcon, ListItemText, MenuItem, Select } from '@mui/material';
import { getChainDetailsFromLitNetwork, litChainList } from 'connectors/chains';
import { Controller, useFormContext } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import TokenLogo from 'components/common/TokenLogo';

import type { FormValues } from '../hooks/useTokensForm';
import { tokenCheck } from '../utils/utils';

export function TokenGateTokenFields() {
  const {
    register,
    watch,
    control,
    formState: { errors }
  } = useFormContext<FormValues>();
  const check = watch('check');

  return (
    <>
      <FieldWrapper label='Blockchain'>
        <Select<FormValues['chain']>
          fullWidth
          displayEmpty
          error={!!errors.chain?.message}
          renderValue={(selected) => getChainDetailsFromLitNetwork(selected)?.chainName || selected || 'Select a Chain'}
          {...register('chain')}
        >
          {litChainList.map((_chain) => (
            <MenuItem key={_chain.chainName} value={_chain.litNetwork}>
              <ListItemIcon>
                <TokenLogo height={20} src={_chain.iconUrl} />
              </ListItemIcon>
              <ListItemText>{_chain.chainName}</ListItemText>
            </MenuItem>
          ))}
        </Select>
        {errors.chain?.message && <FormHelperText>{errors.chain?.message}</FormHelperText>}
      </FieldWrapper>
      <FieldWrapper label='Which group should be able to access this asset'>
        <Select<string>
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
