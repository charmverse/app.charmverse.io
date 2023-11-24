import { Box, Card, CardContent, Typography } from '@mui/material';
import { useEffect } from 'react';

import { useReviewTokenGate } from 'charmClient/hooks/tokengates';
import LoadingComponent from 'components/common/LoadingComponent';
import { ConditionsGroup } from 'components/common/SpaceAccessGate/components/TokenGate/TokenGateConditions';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { humanizeConditionsData } from 'lib/tokenGates/humanizeConditions';

import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateFooter } from './TokenGateFooter';

export function TokenGateReview() {
  const { account } = useWeb3Account();
  const { unifiedAccessControlConditions, resetModal, createUnifiedAccessControlConditions, loadingToken } =
    useTokenGateModal();
  const { trigger, data, isMutating } = useReviewTokenGate();

  useEffect(() => {
    if (unifiedAccessControlConditions.length > 0) {
      trigger({
        conditions: { unifiedAccessControlConditions }
      });
    }
  }, [trigger, unifiedAccessControlConditions]);

  const enrichedUnifiedAccessControlConditions = data?.[0]?.conditions?.unifiedAccessControlConditions;
  const conditionsData = humanizeConditionsData({
    myWalletAddress: account || '',
    unifiedAccessControlConditions: enrichedUnifiedAccessControlConditions
  });

  const onSubmit = async () => {
    await createUnifiedAccessControlConditions();
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
      <TokenGateFooter onSubmit={onSubmit} onCancel={resetModal} isValid={!loadingToken} />
    </>
  );
}
