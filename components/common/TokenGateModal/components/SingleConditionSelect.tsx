import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateCollectables } from './TokenGateCollectables';
import { TokenGateHome } from './TokenGateHome';
import { TokenGateReview } from './TokenGateReview';
import { TokenGateTokens } from './TokenGateTokens';

export function SingleConditionSelect() {
  const { displayedPage } = useTokenGateModal();

  if (displayedPage === 'home') {
    return <TokenGateHome />;
  }

  if (displayedPage === 'collectables') {
    return <TokenGateCollectables />;
  }

  if (displayedPage === 'tokens') {
    return <TokenGateTokens />;
  }

  if (displayedPage === 'review') {
    return <TokenGateReview />;
  }

  return null;
}
