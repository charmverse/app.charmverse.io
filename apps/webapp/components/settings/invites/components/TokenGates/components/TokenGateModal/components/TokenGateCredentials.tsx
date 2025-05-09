import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';

import type { FormValues } from '../hooks/useCredentialsForm';
import { useCredentialsForm } from '../hooks/useCredentialsForm';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getCredentialsAccessControlConditions } from '../utils/getCredentialsAccessControlConditions';
import { gitcoinPassportCheck } from '../utils/utils';

import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateCredentials() {
  const {
    register,
    getValues,
    watch,
    formState: { errors, isValid },
    reset
  } = useCredentialsForm();

  const check = watch('check');

  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getCredentialsAccessControlConditions(values) || [];
    handleTokenGate({ conditions: { accessControlConditions: valueProps } });
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  return (
    <>
      <FieldWrapper label='Select an option'>
        <Select<FormValues['check']>
          displayEmpty
          fullWidth
          renderValue={(selected) =>
            gitcoinPassportCheck.find((c) => c.id === selected)?.name || selected || 'Select...'
          }
          {...register('check')}
        >
          {gitcoinPassportCheck.map((type) => (
            <MenuItem key={type.id} value={type.id}>
              {type.name}
            </MenuItem>
          ))}
        </Select>
      </FieldWrapper>
      {check === 'score' && (
        <NumberInputField
          fullWidth
          disableArrows
          label='Gitcoin Passport Score'
          error={errors.score?.message}
          helperText={errors.score?.message}
          {...register('score')}
        />
      )}
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </>
  );
}
