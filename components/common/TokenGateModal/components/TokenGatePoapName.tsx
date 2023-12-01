import { FormHelperText, MenuItem, Select } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { FormValues } from '../hooks/useCollectablesForm';
import { poapNameMatch } from '../utils/utils';

export function TokenGatePoapName() {
  const {
    register,
    formState: { errors }
  } = useFormContext<FormValues>();

  return (
    <>
      <FieldWrapper label='Match conditions'>
        <Select<FormValues['poapNameMatch']>
          fullWidth
          displayEmpty
          error={!!errors.poapNameMatch?.message}
          {...register('poapNameMatch')}
        >
          {poapNameMatch.map((poap) => (
            <MenuItem key={poap.id} value={poap.id}>
              {poap.name}
            </MenuItem>
          ))}
        </Select>
        {errors.poapNameMatch?.message && <FormHelperText>{errors.poapNameMatch?.message}</FormHelperText>}
      </FieldWrapper>
      <TextInputField
        label='POAP Name'
        error={errors.poapName?.message}
        helperText={errors.poapName?.message}
        {...register('poapName')}
      />
    </>
  );
}
