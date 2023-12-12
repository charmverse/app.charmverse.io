import { log } from '@charmverse/core/log';
import { Card, CardContent, Typography } from '@mui/material';
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
  const {
    unifiedAccessControlConditions,
    resetModal,
    createUnifiedAccessControlConditions,
    loadingToken,
    error,
    flow,
    onClose,
    setFlow,
    setDisplayedPage
  } = useTokenGateModal();
  const { trigger, data, isMutating } = useReviewTokenGate();

  const enrichedUnifiedAccessControlConditions = data?.[0]?.conditions?.unifiedAccessControlConditions;
  const conditionsData = humanizeConditionsData({
    myWalletAddress: account || '',
    unifiedAccessControlConditions: enrichedUnifiedAccessControlConditions
  });

  useEffect(() => {
    if (unifiedAccessControlConditions.length > 0) {
      trigger({
        conditions: { unifiedAccessControlConditions }
      });
    }
  }, [trigger, unifiedAccessControlConditions]);

  useEffect(() => {
    if (error) {
      showMessage('Something went wrong while creating the token gate.', 'error');
    }
  }, [error, showMessage]);

  const onSubmit = async () => {
    try {
      await createUnifiedAccessControlConditions();
      showMessage('Token gate created successfully', 'success');
      onClose();
    } catch (e: any) {
      if (e?.name === 'UserRejectedRequestError') {
        showMessage('Signature rejected by the user', 'warning');
      } else {
        showMessage(`Could not create token gate conditions: ${e.message || 'unknown reason'}`, 'error');
        log.error('Error while creating token gate conditions', { error: e });
      }
    }
  };

  const handleMultipleConditions = (_flow: Flow) => {
    setFlow(_flow);
    setDisplayedPage('home');
  };

  return (
    <>
      <Typography>Review your conditions and confirm</Typography>
      {!data || isMutating ? (
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
      <TokenGateFooter onSubmit={onSubmit} onCancel={resetModal} isValid={!loadingToken} />
    </>
  );
}
