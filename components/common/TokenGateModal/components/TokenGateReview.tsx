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
