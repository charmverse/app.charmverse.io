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
  const { setDisplayedPage, flow, handleTokenGate } = useTokenGateModal();

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
      handleTokenGate({
        type: 'unlock',
        conditions: { chainId: Number(values.chain), contract: values.contract }
      });
      setDisplayedPage('review');
    } else if (values.collectableOption === 'HYPERSUB' && values.chain && values.contract) {
      handleTokenGate({
        type: 'hypersub',
        conditions: { chainId: Number(values.chain), contract: values.contract }
      });
      setDisplayedPage('review');
    } else {
      const valueProps = getCollectablesUnifiedAccessControlConditions(values) || [];

      if (valueProps.length > 0) {
        handleTokenGate({ type: 'lit', conditions: { unifiedAccessControlConditions: valueProps } });
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
          renderValue={(selected) =>
            collectableOptions.find((op) => op.id === selected)?.name || selected || 'Select a collectible type'
          }
          {...register('collectableOption')}
        >
          {collectableOptions
            .filter((col) => !((col.id === 'UNLOCK' || col.id === 'HYPERSUB') && flow !== 'single'))
            .map((type) => (
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
