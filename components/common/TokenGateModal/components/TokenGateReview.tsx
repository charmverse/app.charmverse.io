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

import { TokenGateReviewLit } from './TokenGateReviewLit';
import { TokenGateReviewUnlock } from './TokenGateReviewUnlock';

export function TokenGateReview() {
  const { lock, unifiedAccessControlConditions } = useTokenGateModal();

  if (lock) {
    return <TokenGateReviewUnlock />;
  }

  if (unifiedAccessControlConditions.length > 0) {
    return <TokenGateReviewLit />;
  }

  return null;
}
