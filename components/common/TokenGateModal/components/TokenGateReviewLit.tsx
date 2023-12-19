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
import { humanizeLitConditionsData } from 'lib/tokenGates/humanizeConditions';

import type { Flow } from '../hooks/useTokenGateModalContext';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateAddMultipleButton } from './TokenGateAddMultipleButton';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateReviewLit() {
  const { account } = useWeb3Account();
  const { showMessage } = useSnackbar();
  const { unifiedAccessControlConditions, resetModal, onSubmit, loadingToken, error, flow, setFlow, setDisplayedPage } =
    useTokenGateModal();
  const { trigger: reviewTokenGate, data, isMutating } = useReviewTokenGate();

  const enrichedUnifiedAccessControlConditions = data?.[0]?.conditions?.unifiedAccessControlConditions;
  const conditionsData = humanizeLitConditionsData({
    myWalletAddress: account || '',
    unifiedAccessControlConditions: enrichedUnifiedAccessControlConditions
  });

  useEffect(() => {
    if (unifiedAccessControlConditions.length > 0) {
      reviewTokenGate({
        conditions: { unifiedAccessControlConditions }
      });
    }
  }, [reviewTokenGate, unifiedAccessControlConditions]);

  useEffect(() => {
    if (error) {
      showMessage('Something went wrong while creating the token gate.', 'error');
    }
  }, [error, showMessage]);

  const onSubmitCondition = async () => {
    await onSubmit('lit');
    showMessage('Token gate created successfully', 'success');
  };

  const handleMultipleConditions = (_flow: Flow) => {
    setFlow(_flow);
    setDisplayedPage('home');
  };

  return (
    <>
      <Typography>Review your conditions and confirm</Typography>
      {isMutating ? (
        <LoadingComponent isLoading={isMutating} />
      ) : (
        <Card variant='outlined' color='default'>
          <CardContent>
            <ConditionsGroup conditions={conditionsData} />
          </CardContent>
        </Card>
      )}
      {data && flow === 'single' && <TokenGateAddMultipleButton onClick={handleMultipleConditions} />}
      {data && flow !== 'single' && (
        <Button variant='outlined' onClick={() => setDisplayedPage('home')}>
          Add a condition
        </Button>
      )}
      <TokenGateFooter onSubmit={onSubmitCondition} onCancel={resetModal} loading={loadingToken} />
    </>
  );
}
