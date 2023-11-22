import { Box, MenuItem, Select } from '@mui/material';
import { FormProvider } from 'react-hook-form';

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
      <Box display='flex' gap={2} flexDirection='column'>
        <Box>
          <Select<string>
            displayEmpty
            fullWidth
            renderValue={(selected) => selected || 'Select a Digital Collectible'}
            {...register('collectableOption')}
          >
            {collectableOptions.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.name}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <TokenGateCollectableFields />
        <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
      </Box>
    </FormProvider>
  );
}
