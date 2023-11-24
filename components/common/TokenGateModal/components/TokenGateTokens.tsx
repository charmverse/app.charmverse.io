import Box from '@mui/material/Box';
import { FormProvider } from 'react-hook-form';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { useTokensForm } from '../hooks/useTokensForm';
import { getTokensUnifiedAccessControlConditions } from '../utils/getTokensUnifiedAccessControlConditions';

import { TokenGateFooter } from './TokenGateFooter';
import { TokenGateTokenFields } from './TokenGateTokensFields';

export function TokenGateTokens() {
  const { setDisplayedPage, handleUnifiedAccessControlConditions } = useTokenGateModal();
  const methods = useTokensForm();
  const {
    getValues,
    reset,
    formState: { isValid }
  } = methods;

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getTokensUnifiedAccessControlConditions(values) || [];
    handleUnifiedAccessControlConditions(valueProps);
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  return (
    <FormProvider {...methods}>
      <TokenGateTokenFields />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </FormProvider>
  );
}
