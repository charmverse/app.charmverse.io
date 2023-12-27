import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';

import { useReviewTokenGate } from 'charmClient/hooks/tokenGates';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { ConditionsGroup } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGateConditions';
import { useSnackbar } from 'hooks/useSnackbar';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { humanizeConditionsData } from 'lib/tokenGates/humanizeConditions';

import type { Flow } from '../hooks/useTokenGateModalContext';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateAddMultipleButton } from './TokenGateAddMultipleButton';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateReview() {
  const { account } = useWeb3Account();
  const { showMessage } = useSnackbar();
  const { resetModal, onSubmit, loadingToken, error, flow, setFlow, setDisplayedPage, tokenGate } = useTokenGateModal();
  const { trigger: reviewTokenGate, data: initialData, isMutating } = useReviewTokenGate();
  const data = initialData?.[0];

  const conditionsData = data ? humanizeConditionsData(data, account || '') : null;

  useEffect(() => {
    if (tokenGate?.conditions) {
      reviewTokenGate(tokenGate, {
        onError: () => showMessage('Something went wrong. Please review your conditions.', 'error')
      });
    }
  }, [tokenGate, reviewTokenGate, showMessage]);

  useEffect(() => {
    if (error) {
      showMessage('Something went wrong while creating the token gate.', 'error');
    }
  }, [error, showMessage]);

  const onSubmitCondition = async () => {
    await onSubmit();
    showMessage('Token gate created successfully', 'success');
  };

  const handleMultipleConditions = (_flow: Flow) => {
    setFlow(_flow);
    setDisplayedPage('home');
  };

  const goToHome = () => setDisplayedPage('home');

  return (
    <>
      <Typography>Review your conditions and confirm</Typography>
      <LoadingComponent isLoading={isMutating} />
      {conditionsData && (
        <Card variant='outlined' color='default'>
          <CardContent>
            <ConditionsGroup conditions={conditionsData} />
          </CardContent>
        </Card>
      )}
      {data?.type === 'lit' && flow === 'single' && <TokenGateAddMultipleButton onClick={handleMultipleConditions} />}
      {data?.type === 'lit' && flow !== 'single' && (
        <Button variant='outlined' onClick={goToHome}>
          Add a condition
        </Button>
      )}
      <TokenGateFooter onSubmit={onSubmitCondition} onCancel={resetModal} loading={loadingToken} />
    </>
  );
}
