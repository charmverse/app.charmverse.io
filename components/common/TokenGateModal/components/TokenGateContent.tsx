import { useTokenGateModal } from '../hooks/useTokenGateModalContext';

import { TokenGateCollectables } from './TokenGateCollectables';
import { TokenGateDao } from './TokenGateDao';
import { TokenGateGitcoin } from './TokenGateGitcoin';
import { TokenGateHome } from './TokenGateHome';
import { TokenGateReview } from './TokenGateReview';
import { TokenGateTokens } from './TokenGateTokens';
import { TokenGateWallet } from './TokenGateWallet';

export function TokenGateContent() {
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

  if (displayedPage === 'wallet') {
    return <TokenGateWallet />;
  }

  if (displayedPage === 'dao') {
    return <TokenGateDao />;
  }

  if (displayedPage === 'gitcoin') {
    return <TokenGateGitcoin />;
  }

  return null;
}
