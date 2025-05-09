import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';

import { useReviewTokenGate } from 'charmClient/hooks/tokenGates';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { ConditionsGroup } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGateConditions';
import { useSnackbar } from 'hooks/useSnackbar';
import { humanizeConditionsData } from '@packages/lib/tokenGates/humanizeConditions';

import type { Flow } from '../hooks/useTokenGateModalContext';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateAddMultipleButton } from './TokenGateAddMultipleButton';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateReview() {
  const { showMessage } = useSnackbar();
  const {
    resetModal,
    onSubmit,
    loadingToken,
    error,
    flow,
    setFlow,
    setDisplayedPage,
    tokenGate,
    onDelete,
    handleTokenGate
  } = useTokenGateModal();
  const { trigger: reviewTokenGate, data: initialData, isMutating } = useReviewTokenGate();
  const data = initialData?.conditions;

  const conditionsData = data ? humanizeConditionsData(data) : null;

  useEffect(() => {
    if (tokenGate?.conditions) {
      reviewTokenGate(tokenGate, {
        onError: () => showMessage('Something went wrong. Please review your conditions.', 'error')
      });
    }
  }, [tokenGate?.conditions]);

  useEffect(() => {
    if (error) {
      showMessage('Something went wrong while creating the token gate.', 'error');
    }
  }, [error]);

  const onTokenGateSubmit = async () => {
    await onSubmit();
    showMessage('Token gate created successfully', 'success');
  };

  const handleMultipleConditions = (_flow: Flow) => {
    handleTokenGate({ conditions: { operator: _flow === 'multiple_all' ? 'AND' : 'OR', accessControlConditions: [] } });
    setFlow(_flow);
    setDisplayedPage('home');
  };

  const goToHome = () => setDisplayedPage('home');

  const handleDelete = flow !== 'single' && conditionsData && conditionsData.length > 1 ? onDelete : undefined;

  const isLoading = !conditionsData && isMutating;

  return (
    <>
      <Typography>Review your conditions and confirm</Typography>
      <LoadingComponent isLoading={!conditionsData && isMutating} />
      {conditionsData && (
        <Card variant='outlined' color='default'>
          <CardContent>
            <ConditionsGroup
              conditions={conditionsData}
              operator={data?.operator}
              onDelete={handleDelete}
              isLoading={isMutating}
            />
          </CardContent>
        </Card>
      )}
      {flow === 'single' && <TokenGateAddMultipleButton onClick={handleMultipleConditions} disabled={isLoading} />}
      {flow !== 'single' && (
        <Button variant='outlined' onClick={goToHome} disabled={isLoading}>
          Add a condition
        </Button>
      )}
      <TokenGateFooter onSubmit={onTokenGateSubmit} onCancel={resetModal} loading={loadingToken} />
    </>
  );
}
