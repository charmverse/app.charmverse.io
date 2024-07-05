import { FormProvider } from 'react-hook-form';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';
import { useTokensForm } from '../hooks/useTokensForm';
import { getTokensAccessControlConditions } from '../utils/getTokensAccessControlConditions';

import { TokenGateFooter } from './TokenGateFooter';
import { TokenGateTokenFields } from './TokenGateTokensFields';

/**
 * ERC-20 tokens
 */
export function TokenGateTokens() {
  const { setDisplayedPage, handleTokenGate } = useTokenGateModal();
  const form = useTokensForm();
  const {
    getValues,
    reset,
    formState: { isValid }
  } = form;

  const onSubmit = async () => {
    const values = getValues();
    const valueProps = getTokensAccessControlConditions(values) || [];
    handleTokenGate({ conditions: { accessControlConditions: valueProps } });
    setDisplayedPage('review');
  };

  const onCancel = () => {
    setDisplayedPage('home');
    reset();
  };

  return (
    <FormProvider {...form}>
      <TokenGateTokenFields />
      <TokenGateFooter onSubmit={onSubmit} onCancel={onCancel} isValid={isValid} />
    </FormProvider>
  );
}
