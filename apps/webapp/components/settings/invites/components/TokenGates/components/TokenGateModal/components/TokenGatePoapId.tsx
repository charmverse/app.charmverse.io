import { useFormContext } from 'react-hook-form';

import { NumberInputField } from 'components/common/form/fields/NumberInputField';

import type { FormValues } from '../hooks/useCollectablesForm';

export function TokenGatePoapId() {
  const {
    register,
    formState: { errors }
  } = useFormContext<FormValues>();

  return (
    <NumberInputField
      label='POAP ID'
      fullWidth
      disableArrows
      error={errors.poapId?.message}
      helperText={errors.poapId?.message}
      {...register('poapId')}
    />
  );
}
