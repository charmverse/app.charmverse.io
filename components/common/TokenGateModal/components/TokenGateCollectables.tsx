import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import { FormProvider } from 'react-hook-form';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';

import type { FormValues } from '../hooks/useCollectablesForm';
import { useCollectablesForm } from '../hooks/useCollectablesForm';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getCollectablesUnifiedAccessControlConditions } from '../utils/getCollectablesUnifiedAccessControlConditions';
import { collectableOptions } from '../utils/utils';

import { TokenGateCollectableFields } from './TokenGateCollectableFields';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateCollectables() {
  const { setDisplayedPage, handleUnifiedAccessControlConditions } = useTokenGateModal();
  const methods = useCollectablesForm();
  const {
    register,
    getValues,
    reset,
    formState: { isValid }
  } = methods;

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getCollectablesUnifiedAccessControlConditions(values) || [];
    handleUnifiedAccessControlConditions(valueProps);
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
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
          {collectableOptions.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      <TokenGateCollectableFields />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </FormProvider>
  );
}
