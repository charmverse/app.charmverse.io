import { FormHelperText, MenuItem, Select } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';

import type { FormValues } from '../hooks/useCollectablesForm';
import { poapTypes } from '../utils/utils';

import { TokenGatePoapId } from './TokenGatePoapId';
import { TokenGatePoapName } from './TokenGatePoapName';

export function TokenGatePoap() {
  const {
    register,
    watch,
    formState: { errors }
  } = useFormContext<FormValues>();

  const poapType = watch('poapType');

  return (
    <>
      <FieldWrapper label='How would you like to reference this POAP?'>
        <Select<FormValues['poapType']>
          fullWidth
          displayEmpty
          error={!!errors.poapType?.message}
          {...register('poapType')}
        >
          {poapTypes.map((poap) => (
            <MenuItem key={poap.id} value={poap.id}>
              {poap.name}
            </MenuItem>
          ))}
        </Select>
        {errors.poapType?.message && <FormHelperText>{errors.poapType?.message}</FormHelperText>}
      </FieldWrapper>
      {poapType === 'id' && <TokenGatePoapId />}
      {poapType === 'name' && <TokenGatePoapName />}
    </>
  );
}
