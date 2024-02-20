import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { NumberInputField } from 'components/common/form/fields/NumberInputField';

import type { FormValues } from '../hooks/useGitcoinForm';
import { useGitcoinForm } from '../hooks/useGitcoinForm';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { getGitcoinAccessControlConditions } from '../utils/getGitcoinAccessControlConditions';
import { gitcoinPassportCheck } from '../utils/utils';

import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateGitcoin() {
  const {
    register,
    getValues,
    watch,
    formState: { errors, isValid },
    reset
  } = useGitcoinForm();

  const check = watch('check');

  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getGitcoinAccessControlConditions(values) || [];
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
