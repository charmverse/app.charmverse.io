import { Card, CardContent, Typography } from '@mui/material';
import { useEffect } from 'react';

import { useReviewTokenGate } from 'charmClient/hooks/tokengates';
import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { ConditionsGroup } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGateConditions';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { humanizeConditionsData } from 'lib/tokenGates/humanizeConditions';

import type { Flow } from '../hooks/useTokenGateModalContext';
import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateAddMultipleButton } from './TokenGateAddMultipleButton';
import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateReview() {
  const { account } = useWeb3Account();
  const {
    unifiedAccessControlConditions,
    resetModal,
    createUnifiedAccessControlConditions,
    loadingToken,
    flow,
    displayedPage,
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

  const onSubmit = async () => {
    await createUnifiedAccessControlConditions();
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
      <TokenGateFooter
        onSubmit={onSubmit}
        onCancel={resetModal}
        isValid={!loadingToken}
        displayedPage={displayedPage}
      />
    </>
  );
}
