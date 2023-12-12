import { FormHelperText } from '@mui/material';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { FormProvider } from 'react-hook-form';

import { useReviewLock } from 'charmClient/hooks/tokenGates';
import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';

import type { FormValues } from '../hooks/useCollectablesForm';
import { useCollectablesForm } from '../hooks/useCollectablesForm';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getCollectablesUnifiedAccessControlConditions } from '../utils/getCollectablesUnifiedAccessControlConditions';
import { collectableOptions } from '../utils/utils';

import { TokenGateCollectableFields } from './TokenGateCollectableFields';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateCollectables() {
  const { setDisplayedPage, handleUnifiedAccessControlConditions, handleLock, flow } = useTokenGateModal();
  const { trigger, isMutating, error } = useReviewLock();

  const methods = useCollectablesForm();
  const {
    register,
    getValues,
    reset,
    formState: { isValid }
  } = methods;

  const onSubmit = async () => {
    const values = getValues();

    if (values.collectableOption === 'UNLOCK' && values.chain && values.contract) {
      const lock = await trigger({ contract: values.contract, chainId: Number(values.chain) });
      if (lock) {
        handleLock(lock);
        setDisplayedPage('review');
      }
    } else {
      const valueProps = getCollectablesUnifiedAccessControlConditions(values) || [];

      if (valueProps.length > 0) {
        handleUnifiedAccessControlConditions(valueProps);
        setDisplayedPage('review');
      }
    }
  };

  const onCancel = () => {
    reset();
    setDisplayedPage('home');
  };

  return (
    <FormProvider {...methods}>
      <FieldWrapper label='Select a Digital Collectible'>
        <Select<FormValues['collectableOption']>
          displayEmpty
          fullWidth
          renderValue={(selected) => selected || 'Select a collectible type'}
          {...register('collectableOption')}
        >
          {collectableOptions
            .filter((col) => !(col.id === 'UNLOCK' && flow !== 'single'))
            .map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
        </Select>
      </FieldWrapper>
      <TokenGateCollectableFields />
      {error?.message && <FormHelperText error={!!error.message}>{error.message}</FormHelperText>}
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} loading={isMutating} />
    </FormProvider>
  );
}
