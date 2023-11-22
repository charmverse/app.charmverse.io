import { Box, Typography } from '@mui/material';
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
    <Box display='flex' flexDirection='column' gap={3}>
      <Typography>Review your conditions and confirm at bottom</Typography>
      {!data || isMutating ? (
        <LoadingComponent isLoading={isMutating} />
      ) : (
        <ConditionsGroup conditions={conditionsData} />
      )}
      <TokenGateFooter onSubmit={onSubmit} onCancel={resetModal} isValid={!loadingToken} />
    </Box>
  );
}
